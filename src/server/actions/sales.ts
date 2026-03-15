"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// -------------------------------------------------------------
// GET RECENT SALES
// -------------------------------------------------------------
export async function getRecentSales() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        items: {
          include: { flavor: { select: { name: true } } }
        }
      },
      orderBy: { saleDate: 'desc' },
      take: 50
    })
    return { success: true, data: sales }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// -------------------------------------------------------------
// POST: PROCESS SALE (PDV VIRTUAL)
// -------------------------------------------------------------
export type SaleCartItem = {
  flavorId: string;
  quantity: number;
  unitSellPrice: number;
}

export async function processSaleCheckout(cart: SaleCartItem[], paymentMethod: string, discount: number = 0, notes?: string) {
  try {
    if (cart.length === 0) return { success: false, error: "Carrinho vazio." }

    const stockErrors = []
    let totalGrossAmount = 0
    const snapshotItemsData: any[] = []

    for (const item of cart) {
      if(item.quantity <= 0) continue

      const flavor = await prisma.flavor.findUnique({
        where: { id: item.flavorId },
        include: { stock: true, recipes: { where: { active: true } } }
      })

      if (!flavor) throw new Error("Item inválido detectado")

      const availableQuantity = flavor.stock?.quantity || 0
      if (item.quantity > availableQuantity) {
        stockErrors.push(`Estoque insuficiente de ${flavor.name} (Temos ${availableQuantity}, pedindo ${item.quantity})`)
      }

      // Snapshot Crucial: Capturamos o custo unitário EXATAMENTE NESTE SEGUNDO pra travar o lucro da venda hoje.
      const activeRecipe = flavor.recipes[0]
      const frozenUnitCost = activeRecipe?.estimatedUnitCost || 0 // Se vender sabor sem receita, o lucro é full(100%), custo 0.
      
      const itemGrossTotal = item.quantity * item.unitSellPrice
      totalGrossAmount += itemGrossTotal

      const itemLiquidProfit = (item.unitSellPrice - frozenUnitCost) * item.quantity

      snapshotItemsData.push({
        flavorId: item.flavorId,
        quantity: item.quantity,
        unitSellPrice: item.unitSellPrice,
        unitCostAtSaleTime: frozenUnitCost,
        totalMarginLiquid: itemLiquidProfit
      })
    }

    if (stockErrors.length > 0) return { success: false, error: stockErrors.join(" | ") }

    const finalAmount = totalGrossAmount - discount

    // 2. Transação Inserção e Baixas
    await prisma.$transaction(async (tx: any) => {
      // Criar O Recibo de Venda Header
      const sale = await tx.sale.create({
        data: {
          totalAmount: finalAmount,
          discountAmount: discount,
          paymentMethod,
          notes,
          items: {
            create: snapshotItemsData
          }
        }
      })

      // Abater de maneira individual o estoque acabado (Geladeira)
      for (const snap of snapshotItemsData) {
        await tx.finishedProductStock.update({
          where: { flavorId: snap.flavorId },
          data: { quantity: { decrement: snap.quantity } }
        })

        await tx.productStockMovement.create({
          data: {
            flavorId: snap.flavorId,
            type: "SALE_OUT",
            quantity: snap.quantity,
            notes: `Baixa PDV - Recibo ${sale.id}`
          }
        })
      }
    })

    revalidatePath("/vendas")
    revalidatePath("/sabores")

    return { success: true }
  } catch(error: any) {
    return { success: false, error: "Erro crítico ao faturar venda: " + error.message }
  }
}
