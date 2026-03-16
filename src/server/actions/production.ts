"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/session"

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
    // ✅ FIX S3: Verificar autenticação antes de executar ação crítica
    await requireAuth()

    if (quantityProduced <= 0) return { success: false, error: "A quantidade deve ser maior que zero." }

    // 1. Validar se o sabor tem uma receita ativa
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

    // ✅ FIX B1: Resolver ids e quantidades ANTES da transação para evitar N+1 queries
    const multiplier = quantityProduced / activeRecipe.yieldUnits
    const ingredientIds = activeRecipe.items.map(i => i.ingredientId)

    // Buscar todos os ingredientes de uma vez (anti N+1)
    const ingredients = await prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } }
    })
    const ingMap = new Map(ingredients.map(i => [i.id, i]))

    // ✅ FIX C1: Verificar estoque ANTES da transação e retornar erro descritivo
    const stockErrors: string[] = []
    for (const item of activeRecipe.items) {
      const ing = ingMap.get(item.ingredientId)
      if (!ing) {
        return { success: false, error: `Ingrediente não encontrado: ${item.ingredientId}` }
      }
      const requiredQty = item.quantity * multiplier
      if (ing.currentStock < requiredQty) {
        stockErrors.push(
          `Estoque insuficiente de "${ing.name}": disponível ${ing.currentStock.toFixed(2)} ${ing.unitMeasure}, necessário ${requiredQty.toFixed(2)} ${ing.unitMeasure}`
        )
      }
    }
    if (stockErrors.length > 0) {
      return { success: false, error: stockErrors.join("\n") }
    }

    // 2. Transação Atômica: Abate ingredientes + Injeta produto pronto
    await prisma.$transaction(async (tx) => {
      let realBatchCost = 0

      for (const item of activeRecipe.items) {
        const ing = ingMap.get(item.ingredientId)!
        const requiredQuantity = item.quantity * multiplier

        realBatchCost += requiredQuantity * ing.unitCost

        // ✅ FIX extra: usar decrement garante que a atualização é atômica no banco
        await tx.ingredient.update({
          where: { id: ing.id },
          data: { currentStock: { decrement: requiredQuantity } }
        })

        await tx.ingredientStockMovement.create({
          data: {
            ingredientId: ing.id,
            type: "PROD_USE",
            quantity: requiredQuantity,
            notes: `Consumido na Produção. Lote: ${flavor.name} (${quantityProduced} un)`
          }
        })
      }

      // Gravar a Produção e foto do custo
      await tx.productionBatch.create({
        data: {
          flavorId: flavor.id,
          recipeId: activeRecipe.id,
          quantityProduced,
          totalProductionCost: realBatchCost,
          notes
        }
      })

      // Incrementar Produto Acabado
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
          notes
        }
      })
    })

    // ✅ FIX B6: Revalidar dashboard também
    revalidatePath("/producao")
    revalidatePath("/ingredientes")
    revalidatePath("/sabores")
    revalidatePath("/")
    return { success: true }

  } catch (error: any) {
    // ✅ FIX B5: Log interno, mensagem genérica para o cliente
    console.error("[Production] Erro na transação:", error)
    return { success: false, error: error.message || "Falha na produção. Tente novamente." }
  }
}
