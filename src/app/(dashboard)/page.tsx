export const dynamic = "force-dynamic"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, TrendingUp, Package, Percent, Receipt, Factory } from "lucide-react"
import { getDashboardMetrics } from "@/server/queries/dashboard"

const money = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(val)

export default async function DashboardPage() {
  const metricsRes = await getDashboardMetrics()

  const m = metricsRes.success && metricsRes.data ? metricsRes.data : {
    currentGrossRevenue: 0,
    currentNetProfit: 0,
    currentCostOfGoodsSold: 0,
    totalExpenses: 0,
    totalUnitsSold: 0,
    totalUnitsProduced: 0
  }

  const profitMarginPercent = m.currentGrossRevenue > 0
    ? ((m.currentNetProfit / m.currentGrossRevenue) * 100).toFixed(1)
    : "0.0"

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-up">
        <div>
          <h2
            className="text-3xl font-bold tracking-tight"
            style={{ color: "oklch(0.25 0.04 30)", fontFamily: "var(--font-display)" }}
          >
            Painel de Controle
          </h2>
          <p className="mt-1 text-sm" style={{ color: "oklch(0.52 0.02 30)" }}>
            Resumo financeiro e operacional do <span className="font-semibold" style={{ color: "oklch(0.52 0.22 350)" }}>Mês Atual</span>.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        {/* Faturamento Bruto — verde esmeralda */}
        <Card
          className="shadow-sm border-0 overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-200 animate-fade-up"
          style={{ background: "oklch(0.998 0.004 80)", animationDelay: "0ms" }}
        >
          <div className="h-1 w-full" style={{ background: "oklch(0.60 0.18 160)" }} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.52 0.02 30)" }}>
              Faturamento Bruto
            </CardTitle>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.92 0.08 160)" }}>
              <DollarSign className="h-4 w-4" style={{ color: "oklch(0.48 0.18 160)" }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "oklch(0.25 0.04 30)", fontFamily: "var(--font-display)" }}>
              {money(m.currentGrossRevenue)}
            </div>
            <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.02 30)" }}>Tudo que entrou no caixa este mês</p>
          </CardContent>
        </Card>

        {/* Lucro Líquido — rose */}
        <Card
          className="shadow-sm border-0 overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-200 animate-fade-up"
          style={{ background: "oklch(0.998 0.004 80)", animationDelay: "80ms" }}
        >
          <div className="h-1 w-full" style={{ background: "oklch(0.52 0.22 350)" }} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.52 0.02 30)" }}>
              Lucro Líquido
            </CardTitle>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.93 0.06 350)" }}>
              <TrendingUp className="h-4 w-4" style={{ color: "oklch(0.52 0.22 350)" }} />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{
                color: m.currentNetProfit >= 0 ? "oklch(0.52 0.22 350)" : "oklch(0.55 0.22 27)",
                fontFamily: "var(--font-display)"
              }}
            >
              {money(m.currentNetProfit)}
            </div>
            <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.02 30)" }}>Após abater ingredientes e despesas</p>
          </CardContent>
        </Card>

        {/* Margem % — âmbar */}
        <Card
          className="shadow-sm border-0 overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-200 animate-fade-up"
          style={{ background: "oklch(0.998 0.004 80)", animationDelay: "160ms" }}
        >
          <div className="h-1 w-full" style={{ background: "oklch(0.76 0.14 65)" }} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.52 0.02 30)" }}>
              Margem de Lucro
            </CardTitle>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.95 0.07 75)" }}>
              <Percent className="h-4 w-4" style={{ color: "oklch(0.62 0.14 65)" }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "oklch(0.25 0.04 30)", fontFamily: "var(--font-display)" }}>
              {profitMarginPercent}%
            </div>
            <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.02 30)" }}>Rentabilidade do negócio</p>
          </CardContent>
        </Card>

        {/* Unidades Vendidas — azul */}
        <Card
          className="shadow-sm border-0 overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-200 animate-fade-up"
          style={{ background: "oklch(0.998 0.004 80)", animationDelay: "240ms" }}
        >
          <div className="h-1 w-full" style={{ background: "oklch(0.62 0.18 220)" }} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.52 0.02 30)" }}>
              Unidades Vendidas
            </CardTitle>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.93 0.05 220)" }}>
              <Package className="h-4 w-4" style={{ color: "oklch(0.50 0.18 220)" }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "oklch(0.25 0.04 30)", fontFamily: "var(--font-display)" }}>
              {m.totalUnitsSold} <span className="text-sm font-normal" style={{ color: "oklch(0.55 0.02 30)" }}>un</span>
            </div>
            <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.02 30)" }}>Total despachado este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* DRE e Produção */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        <Card
          className="lg:col-span-4 shadow-sm border-0 animate-fade-up"
          style={{ background: "oklch(0.998 0.004 80)", animationDelay: "320ms" }}
        >
          <CardHeader>
            <CardTitle
              className="text-lg"
              style={{ color: "oklch(0.25 0.04 30)", fontFamily: "var(--font-display)" }}
            >
              Estrutura de Custos (DRE)
            </CardTitle>
            <CardDescription style={{ color: "oklch(0.55 0.02 30)" }}>
              Para onde está indo o dinheiro do faturamento · Mês Atual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.95 0.07 75)" }}>
                  <Package size={20} style={{ color: "oklch(0.62 0.14 65)" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "oklch(0.25 0.04 30)" }}>
                    Custo de Mercadoria Vendida (CMV)
                  </p>
                  <p className="text-xs" style={{ color: "oklch(0.55 0.02 30)" }}>
                    Custo dos ingredientes das unidades já vendidas.
                  </p>
                </div>
              </div>
              <div className="font-bold text-lg" style={{ color: "oklch(0.52 0.22 350)" }}>
                - {money(m.currentCostOfGoodsSold)}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid oklch(0.91 0.015 70)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.93 0.06 350)" }}>
                  <Receipt size={20} style={{ color: "oklch(0.52 0.22 350)" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "oklch(0.25 0.04 30)" }}>
                    Despesas Operacionais
                  </p>
                  <p className="text-xs" style={{ color: "oklch(0.55 0.02 30)" }}>
                    Energia, água, gás, embalagens, transporte.
                  </p>
                </div>
              </div>
              <div className="font-bold text-lg" style={{ color: "oklch(0.52 0.22 350)" }}>
                - {money(m.totalExpenses)}
              </div>
            </div>

            <div
              className="pt-4 flex justify-between items-center"
              style={{ borderTop: "2px solid oklch(0.91 0.015 70)" }}
            >
              <span className="font-bold uppercase text-sm tracking-wider" style={{ color: "oklch(0.35 0.04 30)" }}>
                Resultado Operacional
              </span>
              <span
                className="font-black text-2xl"
                style={{
                  fontFamily: "var(--font-display)",
                  color: m.currentNetProfit >= 0 ? "oklch(0.48 0.18 160)" : "oklch(0.55 0.22 27)"
                }}
              >
                {money(m.currentNetProfit)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card
          className="lg:col-span-3 shadow-sm border-0 animate-fade-up"
          style={{ background: "oklch(0.998 0.004 80)", animationDelay: "400ms" }}
        >
          <CardHeader>
            <CardTitle
              className="text-lg"
              style={{ color: "oklch(0.25 0.04 30)", fontFamily: "var(--font-display)" }}
            >
              Ritmo de Fábrica
            </CardTitle>
            <CardDescription style={{ color: "oklch(0.55 0.02 30)" }}>
              Volume de geladinhos produzidos no mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="flex flex-col items-center justify-center text-center py-8 rounded-xl"
              style={{ background: "linear-gradient(135deg, oklch(0.95 0.04 350 / 40%), oklch(0.96 0.04 65 / 30%))" }}
            >
              <Factory size={38} style={{ color: "oklch(0.52 0.22 350)", marginBottom: "12px" }} />
              <span
                className="text-5xl font-black"
                style={{ color: "oklch(0.52 0.22 350)", fontFamily: "var(--font-display)" }}
              >
                {m.totalUnitsProduced}
              </span>
              <span className="font-semibold mt-2 text-sm" style={{ color: "oklch(0.35 0.04 30)" }}>
                Unidades Embaladas
              </span>
              <p className="text-xs mt-1 max-w-[180px]" style={{ color: "oklch(0.55 0.02 30)" }}>
                Total fabricado no mês, independente de vendas.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
