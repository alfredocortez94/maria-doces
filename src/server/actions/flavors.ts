"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/session"

// -------------------------------------------------------------
// FLAVORS LIST & GET OVERVIEW
// -------------------------------------------------------------
export async function getFlavorsOverview() {
  try {
    const flavors = await prisma.flavor.findMany({
      include: {
        recipes: {
          where: { active: true },
          include: { items: { include: { ingredient: true } } }
        },
        stock: true,
      },
      orderBy: { name: 'asc' }
    })
    return { success: true, data: flavors }
  } catch (error: any) {
    return { success: false, error: "Erro ao buscar sabores: " + error.message }
  }
}

// -------------------------------------------------------------
// CORE MUTATIONS
// -------------------------------------------------------------
export async function createFlavor(formData: FormData) {
  try {
    await requireAuth()
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const suggestedSellPrice = parseFloat(formData.get("suggestedSellPrice") as string) || 0

    if (!name) return { success: false, error: "O nome do sabor é obrigatório." }

    // ✅ FIX N5: Criar sabor e estoque em transação atômica
    const flavor = await prisma.$transaction(async (tx) => {
      const created = await tx.flavor.create({
        data: { name, description, suggestedSellPrice, active: true }
      })
      await tx.finishedProductStock.create({
        data: { flavorId: created.id, quantity: 0 }
      })
      return created
    })

    revalidatePath("/sabores")
    return { success: true, data: flavor }
  } catch (error: any) {
    return { success: false, error: "Falha ao criar sabor: " + error.message }
  }
}

export async function editFlavor(id: string, formData: FormData) {
  try {
    await requireAuth()
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const suggestedSellPrice = parseFloat(formData.get("suggestedSellPrice") as string) || 0

    if (!name) return { success: false, error: "O nome do sabor é obrigatório." }

    await prisma.flavor.update({
      where: { id },
      data: { name, description, suggestedSellPrice }
    })

    revalidatePath("/sabores")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Falha ao editar sabor: " + error.message }
  }
}

export async function toggleFlavorActive(id: string, currentStatus: boolean) {
  try {
    await prisma.flavor.update({
      where: { id },
      data: { active: !currentStatus }
    })
    revalidatePath("/sabores")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteFlavor(id: string) {
  try {
    await requireAuth()
    
    // Deleta o estoque de produto final primeiro
    await prisma.finishedProductStock.deleteMany({
      where: { flavorId: id }
    })
    
    // Deleta o sabor propriamente dito cascateando
    await prisma.flavor.delete({
      where: { id }
    })
    
    revalidatePath("/sabores")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Não foi possível apagar. O Sabor possui histórico de produção vinculado." }
  }
}

// -------------------------------------------------------------
// BILL OF MATERIALS (RECIPE) ENGINE
// -------------------------------------------------------------
type RecipeItemInput = { ingredientId: string; quantity: number }

export async function saveActiveRecipeSnapshot(
  flavorId: string,
  yieldUnits: number,
  items: RecipeItemInput[]
) {
  try {
    await requireAuth()

    const parsedYield = Number(yieldUnits)
    if (!parsedYield || parsedYield <= 0 || isNaN(parsedYield)) return { success: false, error: "O rendimento deve ser um número maior que zero." }
    if (items.length === 0) return { success: false, error: "Adicione ao menos 1 ingrediente." }

    // ✅ FIX B2: Buscar todos os ingredientes de uma vez (anti N+1)
    const ingredientIds = items.map(i => i.ingredientId)
    const ingredients = await prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } }
    })
    if (ingredients.length !== ingredientIds.length) {
      throw new Error("Um ou mais ingredientes da receita não foram encontrados.")
    }
    const ingMap = new Map(ingredients.map(i => [i.id, i]))

    // Calcular custo estimado total
    let totalCostEst = 0
    const resolvedItems = items.map(item => {
      const ing = ingMap.get(item.ingredientId)!
      totalCostEst += ing.unitCost * item.quantity
      return { ingredientId: item.ingredientId, quantity: item.quantity }
    })

    const unitCostEst = totalCostEst / parsedYield

    // Desativar receitas antigas e criar nova em transação
    await prisma.$transaction(async (tx) => {
      await tx.recipe.updateMany({
        where: { flavorId, active: true },
        data: { active: false }
      })

      await tx.recipe.create({
        data: {
          flavorId,
          active: true,
          yieldUnits: parsedYield,
          estimatedTotalCost: totalCostEst,
          estimatedUnitCost: unitCostEst,
          items: { create: resolvedItems }
        }
      })
    })

    revalidatePath("/sabores")
    return { success: true }

  } catch (error: any) {
    console.error("[Flavors] Erro ao salvar receita:", error)
    return { success: false, error: "Erro ao salvar receita: " + error.message }
  }
}
