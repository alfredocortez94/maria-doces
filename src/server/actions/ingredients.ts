"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// -------------------------------------------------------------
// GET
// -------------------------------------------------------------
export async function getIngredients() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' }
    })
    return { success: true, data: ingredients }
  } catch (error: any) {
    return { success: false, error: "Erro ao buscar ingredientes: " + error.message }
  }
}

// -------------------------------------------------------------
// CREATE & UDPATE
// -------------------------------------------------------------

export async function createIngredient(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const category = formData.get("category") as string
    const unitMeasure = formData.get("unitMeasure") as string
    const minStock = parseFloat(formData.get("minStock") as string)
    const currentStock = parseFloat(formData.get("currentStock") as string) || 0
    const unitCost = parseFloat(formData.get("unitCost") as string) || 0
    const supplier = formData.get("supplier") as string

    if (!name || !unitMeasure) {
      return { success: false, error: "Nome e Unidade de Medida são obrigatórios." }
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        category,
        unitMeasure,
        minStock,
        currentStock,
        unitCost,
        supplier,
      }
    })

    // Se criou direto com estoque inicial, devemos lançar um "movement" de entrada inicial? 
    // Por simplicidade no MVP, faremos se for maior que > 0
    if (currentStock > 0) {
      await prisma.ingredientStockMovement.create({
        data: {
          ingredientId: ingredient.id,
          type: "IN",
          quantity: currentStock,
          unitCostAtTransaction: unitCost,
          notes: "Lançamento inicial de estoque."
        }
      })
    }

    revalidatePath("/ingredientes")
    return { success: true, data: ingredient }

  } catch (error: any) {
    return { success: false, error: "Falha ao criar ingrediente: " + error.message }
  }
}

export async function deleteIngredient(id: string) {
  try {
    // Validar se está contido em alguma receita trancaria aqui via restrict key, o Prisma vai lançar erro.
    await prisma.ingredient.delete({
      where: { id }
    })
    revalidatePath("/ingredientes")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Não foi possível apagar. Verifique se não faz parte de alguma Receita/Ficha Técnica." }
  }
}

// -------------------------------------------------------------
// STOCK MOVEMENTS & CMP
// -------------------------------------------------------------

export async function registerStockEntry(ingredientId: string, quantity: number, totalBilledCost: number) {
  "use server"
  try {
    // Custo Medio Ponderado MVP - Como calcular o unitCost "hoje"
    // Se comprei 1 Caixa de leite condensado custando 15 reais (totalBilledCost = 15) mas a caixa vem 395(quantity=395 unit=g).
    // unitCostTransaction = 15 / 395 = 0.0379 reais por grama.
    const unitCostAtTx = totalBilledCost / quantity

    const ingredient = await prisma.ingredient.findUnique({ where: { id: ingredientId } })
    if(!ingredient) throw new Error("Ingrediente não encontrado")

    const newStock = ingredient.currentStock + quantity
    
    // Atualiza para o "Last Cost" (Custo de Reposição Recente). Pra DRE/MVP é a visão mais crua e segura contra inflação.
    // Futuro: CMP = ((oldStock * oldUnit) + (qty * txUnit)) / newStock

    await prisma.$transaction([
      prisma.ingredientStockMovement.create({
        data: {
          ingredientId,
          type: "IN",
          quantity,
          unitCostAtTransaction: unitCostAtTx,
          notes: `Entrada via compra no valor total R$ ${totalBilledCost.toFixed(2)}`
        }
      }),
      prisma.ingredient.update({
        where: { id: ingredientId },
        data: {
          currentStock: newStock,
          unitCost: unitCostAtTx // Atualiza a pauta de TODOS OS SABORES que usam de imediato (motor de regras!)
        }
      })
    ])

    revalidatePath("/ingredientes")
    return { success: true }
  } catch (error: any) {
     return { success: false, error: error.message }
  }
}
