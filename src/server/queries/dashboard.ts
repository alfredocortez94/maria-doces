import prisma from "@/lib/prisma"
import { startOfMonth, endOfMonth } from "date-fns"

export async function getDashboardMetrics() {
  const startDate = startOfMonth(new Date())
  const endDate = endOfMonth(new Date())

  try {
    // 1. Vendas do Mês (Faturamento Bruto e CMV dos Itens Vendidos)
    const salesThisMonth = await prisma.sale.findMany({
      where: {
        saleDate: { gte: startDate, lte: endDate }
      },
      include: { items: true }
    })

    let currentGrossRevenue = 0
    let currentCostOfGoodsSold = 0 // CMV das vendas
    let totalUnitsSold = 0

    salesThisMonth.forEach((sale: any) => {
      currentGrossRevenue += sale.totalAmount
      sale.items.forEach((item: any) => {
        totalUnitsSold += item.quantity
        currentCostOfGoodsSold += (item.unitCostAtSaleTime * item.quantity)
      })
    })

    // 2. Despesas do Mês
    const expensesAgg = await prisma.expense.aggregate({
      where: {
        expenseDate: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true }
    })
    const totalExpenses = expensesAgg._sum.amount || 0

    // 3. Produção do Mês (O que injetamos de fato do almoxarifado pra geladeira)
    const prodAgg = await prisma.productionBatch.aggregate({
      where: {
         date: { gte: startDate, lte: endDate }
      },
      _sum: { quantityProduced: true, totalProductionCost: true }
    })
    const totalUnitsProduced = prodAgg._sum.quantityProduced || 0
    const totalProductionCost = prodAgg._sum.totalProductionCost || 0 // Isso não entra no DRE direto, só quando vende (CMV)

    // Lucro Líquido Real = Faturamento Bruto - (Descontos) - CMV - Despesas
    const currentNetProfit = currentGrossRevenue - currentCostOfGoodsSold - totalExpenses

    return {
      success: true,
      data: {
        currentGrossRevenue,
        currentNetProfit,
        totalUnitsSold,
        totalUnitsProduced,
        currentCostOfGoodsSold,
        totalExpenses
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
