"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/session"

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

// Internal type for sale processing — not exported (not part of API contract)
type SaleSnapshotItem = {
  flavorId: string
  flavorName: string
  quantity: number
  availableQty: number
  unitSellPrice: number
  unitCostAtSaleTime: number
  totalMarginLiquid: number
}

export async function processSaleCheckout(cart: SaleCartItem[], paymentMethod: string, discount: number = 0, notes?: string) {
  try {
    // ✅ FIX S3: Verificar autenticação
    await requireAuth()

    if (cart.length === 0) return { success: false, error: "Carrinho vazio." }
    if (discount < 0) return { success: false, error: "Desconto não pode ser negativo." }

    // Pré-carregar todos os sabores de uma vez (anti N+1)
    const flavorIds = cart.map(i => i.flavorId)
    const flavors = await prisma.flavor.findMany({
      where: { id: { in: flavorIds } },
      include: {
        stock: true,
        recipes: { where: { active: true } }
      }
    })
    const flavorMap = new Map(flavors.map(f => [f.id, f]))

    // 🟡 FIX: Typed snapshot array — was `any[]`
    const snapshotItemsData: SaleSnapshotItem[] = []
    let totalGrossAmount = 0

    for (const item of cart) {
      if (item.quantity <= 0) continue

      const flavor = flavorMap.get(item.flavorId)
      if (!flavor) throw new Error(`Sabor inválido: ${item.flavorId}`)

      // Custo snapshot: usa estimatedUnitCost da receita ativa
      const activeRecipe = flavor.recipes[0]
      const frozenUnitCost = activeRecipe?.estimatedUnitCost || 0

      const itemGrossTotal = item.quantity * item.unitSellPrice
      totalGrossAmount += itemGrossTotal

      snapshotItemsData.push({
        flavorId: item.flavorId,
        flavorName: flavor.name, // para mensagens de erro
        quantity: item.quantity,
        availableQty: flavor.stock?.quantity || 0,
        unitSellPrice: item.unitSellPrice,
        unitCostAtSaleTime: frozenUnitCost,
        totalMarginLiquid: (item.unitSellPrice - frozenUnitCost) * item.quantity
      })
    }

    const finalAmount = Math.max(0, totalGrossAmount - discount)

    // ✅ FIX C4: Verificação de estoque + inserção DENTRO da mesma transação (evita race condition)
    await prisma.$transaction(async (tx) => {
      // Verificar estoque de CADA item dentro da transação
      for (const snap of snapshotItemsData) {
        const currentStock = await tx.finishedProductStock.findUnique({
          where: { flavorId: snap.flavorId }
        })
        const available = currentStock?.quantity || 0
        if (snap.quantity > available) {
          throw new Error(
            `Estoque insuficiente de "${snap.flavorName}": disponível ${available} un, pedido ${snap.quantity} un`
          )
        }
      }

      // Criar o recibo de venda
      const sale = await tx.sale.create({
        data: {
          totalAmount: finalAmount,
          discountAmount: discount,
          paymentMethod,
          notes,
          items: {
            create: snapshotItemsData.map(snap => ({
              flavorId: snap.flavorId,
              quantity: snap.quantity,
              unitSellPrice: snap.unitSellPrice,
              unitCostAtSaleTime: snap.unitCostAtSaleTime,
              totalMarginLiquid: snap.totalMarginLiquid
            }))
          }
        }
      })

      // Abater o estoque acabado para cada item
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
    revalidatePath("/")
    return { success: true }

  } catch (error: any) {
    console.error("[Sales] Erro na venda:", error)
    // Retornar mensagem do throw (são mensagens de negócio, não de banco)
    return { success: false, error: error.message || "Erro ao faturar venda." }
  }
}
