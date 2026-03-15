export const dynamic = "force-dynamic"

import { getRecentSales } from "@/server/actions/sales"
import { getFlavorsOverview } from "@/server/actions/flavors"
import { SalesClient } from "./sales-client"

export default async function SalesPage() {
  const [salesRes, flavorsRes] = await Promise.all([
    getRecentSales(),
    getFlavorsOverview()
  ])

  const sales = salesRes.success ? salesRes.data : []
  // Pro PDV, injetamos só sabores que tem stock > 0
  const flavors = flavorsRes.success 
    ? (flavorsRes as any).data.filter((f: any) => f.stock && f.stock.quantity > 0 && f.active) 
    : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Frente de Caixa (PDV)</h2>
        <p className="text-slate-500 mt-2">
          Terminou as entregas? Dê baixa rápida nos geladinhos vendidos e liquide a margem de lucro calculada.
        </p>
      </div>

      <SalesClient 
        availableFlavors={flavors || []} 
        recentSales={sales || []} 
      />
    </div>
  )
}
