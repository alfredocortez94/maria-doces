"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// -------------------------------------------------------------
// GET PRODUCTION LOG
// -------------------------------------------------------------
export async function getProductionHistory() {
  try {
    const history = await prisma.productionBatch.findMany({
      include: { flavor: true },
      orderBy: { date: 'desc' },
      take: 50
    })
    
    return { success: true, data: history }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// -------------------------------------------------------------
// POST: PROCESS PRODUCTION BATCH (ATOMIC TRANSACTION)
// -------------------------------------------------------------
export async function processProductionBatch(flavorId: string, quantityProduced: number, notes?: string) {
  try {
    if (quantityProduced <= 0) return { success: false, error: "A quantidade deve ser maior que zero." }

    // 1. Validar se o sabor tem uma receita ativa mapeada para fazer o abatimento correto
    const flavor = await prisma.flavor.findUnique({
      where: { id: flavorId },
      include: {
        recipes: {
          where: { active: true },
          include: { items: { include: { ingredient: true } } }
        }
      }
    })

    if (!flavor) return { success: false, error: "Sabor não encontrado." }
    const activeRecipe = flavor.recipes[0]
    
    if (!activeRecipe) {
      return { success: false, error: "Este sabor não possui Ficha Técnica ativa para deduzir o estoque." }
    }

    // 2. Transação Atômica do Banco do MVP: Produziu ? Abate Ingrediente / Injeta Produto Pronto
    await prisma.$transaction(async (tx: any) => {
      
      // Multiplicador = Proporção da tabela. Ex se a receita rende 10, e fiz 20, o mult = 2.
      const multiplier = quantityProduced / activeRecipe.yieldUnits
      let realBatchCost = 0 // Custo congelado que será gravado no Batch
      
      // A. Abater cada ingrediente do almoxarifado
      for (const item of activeRecipe.items) {
        const requiredQuantity = item.quantity * multiplier
        
        const currentIng = await tx.ingredient.findUnique({ where: { id: item.ingredientId } })
        if(!currentIng) throw new Error(`Falha íntegra no item ${item.ingredientId}`)
        
        // Custo deste ingrediente para o lote
        realBatchCost += (requiredQuantity * currentIng.unitCost)

        const newStock = currentIng.currentStock - requiredQuantity

        await tx.ingredient.update({
          where: { id: currentIng.id },
          data: { currentStock: newStock }
        })

        await tx.ingredientStockMovement.create({
          data: {
            ingredientId: currentIng.id,
            type: "PROD_USE",
            quantity: requiredQuantity,
            notes: `Consumido na Produção Automática. Lote: ${flavor.name} (${quantityProduced} un)`
          }
        })
      }

      // B. Gravar a Produção e amarrar a foto do custo
      await tx.productionBatch.create({
        data: {
          flavorId: flavor.id,
          recipeId: activeRecipe.id,
          quantityProduced: quantityProduced,
          totalProductionCost: realBatchCost,
          notes: notes
        }
      })

      // C. Incrementar Produto Acabado
      await tx.finishedProductStock.upsert({
        where: { flavorId: flavor.id },
        update: { quantity: { increment: quantityProduced } },
        create: { flavorId: flavor.id, quantity: quantityProduced }
      })

      await tx.productStockMovement.create({
        data: {
          flavorId: flavor.id,
          type: "PROD_IN",
          quantity: quantityProduced,
          notes: notes
        }
      })
    })

    revalidatePath("/producao")
    revalidatePath("/ingredientes")
    revalidatePath("/sabores")
    return { success: true }

  } catch (error: any) {
    return { success: false, error: "Falha na Transação do Servidor: " + error.message }
  }
}
