export const dynamic = "force-dynamic"

import { getFlavorsOverview } from "@/server/actions/flavors"
import { getIngredients } from "@/server/actions/ingredients"
import { FlavorsClient } from "./flavors-client"

export default async function FlavorsPage() {
  const resultFlavors = await getFlavorsOverview()
  const flavors = resultFlavors.success ? (resultFlavors as any).data : []

  const resultIng = await getIngredients()
  const ingredients = resultIng.success ? resultIng.data : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Catálogo de Sabores e Fichas Técnicas</h2>
        <p className="text-slate-500 mt-2">
          Gerencie o seu cardápio, preencha as receitas e veja o Motor Administrativo calcular seus lucros automáticos.
        </p>
      </div>

      <FlavorsClient 
        initialFlavors={flavors || []} 
        ingredientsList={ingredients || []} 
      />
    </div>
  )
}
