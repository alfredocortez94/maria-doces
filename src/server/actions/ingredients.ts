"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/session"

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
    await requireAuth()
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

    // 🟡 FIX: Wrapped in $transaction — previously ingredient.create and stock movement
    // were separate queries. If movement failed, ingredient existed with no audit history.
    const ingredient = await prisma.$transaction(async (tx) => {
      const created = await tx.ingredient.create({
        data: { name, category, unitMeasure, minStock, currentStock, unitCost, supplier }
      })

      if (currentStock > 0) {
        await tx.ingredientStockMovement.create({
          data: {
            ingredientId: created.id,
            type: "IN",
            quantity: currentStock,
            unitCostAtTransaction: unitCost,
            notes: "Lançamento inicial de estoque."
          }
        })
      }

      return created
    })

    revalidatePath("/ingredientes")
    return { success: true, data: ingredient }

  } catch (error: any) {
    return { success: false, error: "Falha ao criar ingrediente: " + error.message }
  }
}

export async function editIngredient(id: string, formData: FormData) {
  try {
    await requireAuth()
    const name = formData.get("name") as string
    const category = formData.get("category") as string
    const unitMeasure = formData.get("unitMeasure") as string
    const minStock = parseFloat(formData.get("minStock") as string) || 0
    const unitCost = parseFloat(formData.get("unitCost") as string) || 0
    const supplier = formData.get("supplier") as string

    if (!name || !unitMeasure) {
      return { success: false, error: "Nome e Unidade de Medida são obrigatórios." }
    }

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: { name, category, unitMeasure, minStock, unitCost, supplier }
    })

    revalidatePath("/ingredientes")
    return { success: true, data: ingredient }
  } catch (error: any) {
    return { success: false, error: "Falha ao editar ingrediente: " + error.message }
  }
}

export async function deleteIngredient(id: string) {
  try {
    await requireAuth()
    await prisma.ingredient.delete({ where: { id } })
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
  // 🟢 FIX: Removed duplicate "use server" directive (file is already marked "use server")
  try {
    const unitCostAtTx = totalBilledCost / quantity

    const ingredient = await prisma.ingredient.findUnique({ where: { id: ingredientId } })
    if (!ingredient) throw new Error("Ingrediente não encontrado")

    const newStock = ingredient.currentStock + quantity

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
          unitCost: unitCostAtTx
        }
      })
    ])

    revalidatePath("/ingredientes")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
