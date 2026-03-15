export const dynamic = "force-dynamic"

import { getProductionHistory, processProductionBatch } from "@/server/actions/production"
import { getFlavorsOverview } from "@/server/actions/flavors"
import { ProductionClient } from "./production-client"

export default async function ProductionPage() {
  const [historyResult, flavorsResult] = await Promise.all([
    getProductionHistory(),
    getFlavorsOverview()
  ])

  const history = historyResult.success ? historyResult.data : []
  // Filtra apenas sabores que tenham receita ativa, para não bugar a tela
  const flavors = flavorsResult.success 
    ? (flavorsResult as any).data.filter((f: any) => f.recipes?.some((r: any) => r.active)) 
    : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Fábrica & Estoque Pronto</h2>
        <p className="text-slate-500 mt-2">
          Aponte a produção do dia. O sistema se encarrega de dar baixa na despensa.
        </p>
      </div>

      <ProductionClient 
        initialHistory={history || []} 
        flavorsReadyToProduce={flavors || []} 
      />
    </div>
  )
}
