export const dynamic = "force-dynamic"

import { getExpenses } from "@/server/actions/expenses"
import { ExpensesClient } from "./expenses-client"

export default async function ExpensesPage() {
  const res = await getExpenses()
  const expenses = res.success && res.data ? res.data.expenses : []
  const categories = res.success && res.data ? res.data.categories : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Despesas Operacionais</h2>
        <p className="text-slate-500 mt-2">
          Contas, energia, impostos e outros custos de funcionamento que não entram na receita do geladinho.
        </p>
      </div>

      <ExpensesClient 
        initialExpenses={expenses} 
        categories={categories} 
      />
    </div>
  )
}
