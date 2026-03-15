export const dynamic = "force-dynamic"

import { getIngredients } from "@/server/actions/ingredients"
import { IngredientsClient } from "./ingredients-client"

export default async function IngredientsPage() {
  const result = await getIngredients()
  const ingredients = result.success ? result.data : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Ingredientes & Estoque</h2>
        <p className="text-slate-500 mt-2">
          Gerencie seu almoxarifado, custos unitários e recebimento de insumos.
        </p>
      </div>

      <IngredientsClient initialData={ingredients || []} />
    </div>
  )
}
