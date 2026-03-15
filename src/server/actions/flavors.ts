"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

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
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const suggestedSellPrice = parseFloat(formData.get("suggestedSellPrice") as string) || 0

    if (!name) return { success: false, error: "O nome do sabor é obrigatório." }

    const flavor = await prisma.flavor.create({
      data: {
        name,
        description,
        suggestedSellPrice,
        active: true
      }
    })
    
    // Cria um registro de estoque vazio para ele
    await prisma.finishedProductStock.create({
       data: { flavorId: flavor.id, quantity: 0 }
    })

    revalidatePath("/sabores")
    return { success: true, data: flavor }
  } catch (error: any) {
    return { success: false, error: "Falha ao criar sabor: " + error.message }
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
    if(yieldUnits <= 0) return { success: false, error: "O rendimento deve ser maior que zero." }
    if(items.length === 0) return { success: false, error: "Adicione ao menos 1 ingrediente." }

    // Vamos desativar as receitas antigas para manter histórico imutável
    await prisma.recipe.updateMany({
      where: { flavorId, active: true },
      data: { active: false }
    })

    // Calcular o Estimated Cost (Preço Foto de Hoje)
    let totalCostEst = 0
    const resolvedItems = []
    
    for (const item of items) {
      const ingredient = await prisma.ingredient.findUnique({ where: { id: item.ingredientId } })
      if (!ingredient) throw new Error("Ingrediente inválido no lote.")
      
      const lineCost = ingredient.unitCost * item.quantity
      totalCostEst += lineCost
      
      resolvedItems.push({
         ingredientId: item.ingredientId,
         quantity: item.quantity
      })
    }

    const unitCostEst = totalCostEst / yieldUnits

    // Cravar a Nova Receita
    await prisma.recipe.create({
      data: {
        flavorId,
        active: true,
        yieldUnits,
        estimatedTotalCost: totalCostEst,
        estimatedUnitCost: unitCostEst,
        items: {
          create: resolvedItems
        }
      }
    })

    revalidatePath("/sabores")
    return { success: true }

  } catch (error: any) {
    return { success: false, error: "Erro ao salvar receita: " + error.message }
  }
}
