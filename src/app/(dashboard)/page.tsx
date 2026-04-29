export const dynamic = "force-dynamic"

import { DollarSign, TrendingUp, Percent, Package, Receipt, Factory } from "lucide-react"
import { getDashboardMetrics } from "@/server/queries/dashboard"

const money = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(val)

export default async function DashboardPage() {
  const metricsRes = await getDashboardMetrics()

  const m = metricsRes.success && metricsRes.data
    ? metricsRes.data
    : {
        currentGrossRevenue: 0,
        currentNetProfit: 0,
        currentCostOfGoodsSold: 0,
        totalExpenses: 0,
        totalUnitsSold: 0,
        totalUnitsProduced: 0,
      }

  const profitMarginPercent =
    m.currentGrossRevenue > 0
      ? ((m.currentNetProfit / m.currentGrossRevenue) * 100).toFixed(1)
      : "0.0"

  const isProfit = m.currentNetProfit >= 0

  return (
    <div className="space-y-6">

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* Faturamento Bruto */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 animate-fade-up overflow-hidden relative"
          style={{ background: "oklch(0.96 0.05 160 / 55%)", border: "1px solid oklch(0.88 0.07 160 / 50%)", animationDelay: "0ms" }}
        >
          <div className="absolute -right-4 -bottom-4 opacity-[0.08]">
            <DollarSign size={88} style={{ color: "oklch(0.40 0.18 160)" }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "oklch(0.42 0.14 160)" }}>
              Faturamento Bruto
            </span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.80 0.10 160 / 40%)" }}>
              <DollarSign size={15} style={{ color: "oklch(0.40 0.18 160)" }} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black leading-tight" style={{ color: "oklch(0.28 0.12 160)", fontFamily: "var(--font-display)" }}>
              {money(m.currentGrossRevenue)}
            </div>
            <p className="text-xs mt-1" style={{ color: "oklch(0.48 0.10 160)" }}>Tudo que entrou no caixa este mês</p>
          </div>
        </div>

        {/* Lucro Líquido */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 animate-fade-up overflow-hidden relative"
          style={{
            background: isProfit ? "oklch(0.96 0.05 350 / 55%)" : "oklch(0.96 0.04 27 / 45%)",
            border: isProfit ? "1px solid oklch(0.88 0.08 350 / 50%)" : "1px solid oklch(0.88 0.08 27 / 50%)",
            animationDelay: "70ms",
          }}
        >
          <div className="absolute -right-4 -bottom-4 opacity-[0.08]">
            <TrendingUp size={88} style={{ color: isProfit ? "oklch(0.52 0.22 350)" : "oklch(0.55 0.22 27)" }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: isProfit ? "oklch(0.45 0.18 350)" : "oklch(0.50 0.18 27)" }}>
              Lucro Líquido
            </span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: isProfit ? "oklch(0.82 0.08 350 / 40%)" : "oklch(0.82 0.08 27 / 40%)" }}>
              <TrendingUp size={15} style={{ color: isProfit ? "oklch(0.45 0.18 350)" : "oklch(0.50 0.18 27)" }} />
            </div>
          </div>
          <div>
            <div
              className="text-2xl font-black leading-tight"
              style={{ color: isProfit ? "oklch(0.35 0.18 350)" : "oklch(0.45 0.20 27)", fontFamily: "var(--font-display)" }}
            >
              {money(m.currentNetProfit)}
            </div>
            <p className="text-xs mt-1" style={{ color: isProfit ? "oklch(0.50 0.12 350)" : "oklch(0.52 0.14 27)" }}>
              Após ingredientes e despesas
            </p>
          </div>
        </div>

        {/* Margem */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 animate-fade-up overflow-hidden relative"
          style={{ background: "oklch(0.97 0.06 70 / 60%)", border: "1px solid oklch(0.90 0.08 70 / 50%)", animationDelay: "140ms" }}
        >
          <div className="absolute -right-4 -bottom-4 opacity-[0.08]">
            <Percent size={88} style={{ color: "oklch(0.58 0.14 65)" }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "oklch(0.52 0.12 65)" }}>
              Margem de Lucro
            </span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.85 0.10 70 / 40%)" }}>
              <Percent size={15} style={{ color: "oklch(0.52 0.12 65)" }} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black leading-tight" style={{ color: "oklch(0.38 0.12 65)", fontFamily: "var(--font-display)" }}>
              {profitMarginPercent}%
            </div>
            <p className="text-xs mt-1" style={{ color: "oklch(0.52 0.10 65)" }}>Rentabilidade sobre o faturamento</p>
          </div>
        </div>

        {/* Unidades Vendidas */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 animate-fade-up overflow-hidden relative"
          style={{ background: "oklch(0.96 0.04 220 / 50%)", border: "1px solid oklch(0.88 0.06 220 / 50%)", animationDelay: "210ms" }}
        >
          <div className="absolute -right-4 -bottom-4 opacity-[0.07]">
            <Package size={88} style={{ color: "oklch(0.50 0.18 220)" }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "oklch(0.44 0.14 220)" }}>
              Unidades Vendidas
            </span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.82 0.08 220 / 40%)" }}>
              <Package size={15} style={{ color: "oklch(0.44 0.14 220)" }} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black leading-tight flex items-baseline gap-1" style={{ color: "oklch(0.32 0.12 220)", fontFamily: "var(--font-display)" }}>
              {m.totalUnitsSold}
              <span className="text-sm font-semibold" style={{ color: "oklch(0.55 0.10 220)" }}>un</span>
            </div>
            <p className="text-xs mt-1" style={{ color: "oklch(0.50 0.10 220)" }}>Total despachado este mês</p>
          </div>
        </div>
      </div>

      {/* ── DRE + Fábrica ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        {/* DRE */}
        <div
          className="lg:col-span-4 rounded-2xl shadow-sm animate-fade-up overflow-hidden"
          style={{ background: "oklch(0.998 0.004 80)", border: "1px solid oklch(0.91 0.015 70 / 70%)", animationDelay: "280ms" }}
        >
          <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid oklch(0.93 0.012 70)" }}>
            <h3 className="text-lg font-bold" style={{ color: "oklch(0.22 0.04 30)", fontFamily: "var(--font-display)" }}>
              Estrutura de Custos (DRE)
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.02 30)" }}>
              Para onde está indo o faturamento · Mês Atual
            </p>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Faturamento bruto */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: "oklch(0.28 0.04 30)" }}>Faturamento Bruto</p>
                <p className="text-xs" style={{ color: "oklch(0.55 0.02 30)" }}>Receita total das vendas</p>
              </div>
              <span className="font-bold text-base" style={{ color: "oklch(0.42 0.15 160)" }}>
                {money(m.currentGrossRevenue)}
              </span>
            </div>

            {/* CMV */}
            <div className="flex items-center justify-between pl-4" style={{ borderLeft: "2px solid oklch(0.88 0.08 350 / 60%)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.94 0.04 350)" }}>
                  <Package size={13} style={{ color: "oklch(0.52 0.16 350)" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "oklch(0.28 0.04 30)" }}>CMV — Custo de Mercadoria</p>
                  <p className="text-xs" style={{ color: "oklch(0.55 0.02 30)" }}>Ingredientes das unidades vendidas</p>
                </div>
              </div>
              <span className="font-bold text-base" style={{ color: "oklch(0.52 0.22 350)" }}>
                − {money(m.currentCostOfGoodsSold)}
              </span>
            </div>

            {/* Despesas */}
            <div className="flex items-center justify-between pl-4" style={{ borderLeft: "2px solid oklch(0.88 0.08 350 / 60%)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.94 0.04 350)" }}>
                  <Receipt size={13} style={{ color: "oklch(0.52 0.16 350)" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "oklch(0.28 0.04 30)" }}>Despesas Operacionais</p>
                  <p className="text-xs" style={{ color: "oklch(0.55 0.02 30)" }}>Energia, gás, embalagens, transporte</p>
                </div>
              </div>
              <span className="font-bold text-base" style={{ color: "oklch(0.52 0.22 350)" }}>
                − {money(m.totalExpenses)}
              </span>
            </div>

            {/* Resultado */}
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3.5 mt-1"
              style={{ background: isProfit ? "oklch(0.95 0.06 160 / 50%)" : "oklch(0.95 0.04 27 / 40%)" }}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: isProfit ? "oklch(0.40 0.14 160)" : "oklch(0.45 0.16 27)" }}>
                  Resultado Operacional
                </p>
                <p className="text-xs mt-0.5" style={{ color: isProfit ? "oklch(0.50 0.10 160)" : "oklch(0.52 0.12 27)" }}>
                  {isProfit ? "Negócio lucrativo este mês" : "Atenção: resultado negativo"}
                </p>
              </div>
              <span
                className="text-2xl font-black"
                style={{
                  fontFamily: "var(--font-display)",
                  color: isProfit ? "oklch(0.38 0.18 160)" : "oklch(0.48 0.20 27)",
                }}
              >
                {money(m.currentNetProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Fábrica */}
        <div
          className="lg:col-span-3 rounded-2xl shadow-sm animate-fade-up overflow-hidden flex flex-col"
          style={{ background: "oklch(0.998 0.004 80)", border: "1px solid oklch(0.91 0.015 70 / 70%)", animationDelay: "350ms" }}
        >
          <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid oklch(0.93 0.012 70)" }}>
            <h3 className="text-lg font-bold" style={{ color: "oklch(0.22 0.04 30)", fontFamily: "var(--font-display)" }}>
              Ritmo de Fábrica
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.02 30)" }}>
              Volume produzido no mês atual
            </p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-4">
            {/* Anel decorativo */}
            <div
              className="relative w-32 h-32 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, oklch(0.95 0.06 350 / 40%), oklch(0.96 0.06 65 / 35%))" }}
            >
              <div
                className="absolute inset-2 rounded-full"
                style={{ border: "1.5px dashed oklch(0.82 0.08 350 / 50%)" }}
              />
              <Factory size={32} style={{ color: "oklch(0.52 0.22 350)" }} />
            </div>

            <div className="text-center">
              <span
                className="text-5xl font-black leading-none"
                style={{ color: "oklch(0.52 0.22 350)", fontFamily: "var(--font-display)" }}
              >
                {m.totalUnitsProduced}
              </span>
              <p className="font-semibold mt-2 text-sm" style={{ color: "oklch(0.32 0.04 30)" }}>
                Unidades Fabricadas
              </p>
              <p className="text-xs mt-1 max-w-[180px]" style={{ color: "oklch(0.55 0.02 30)" }}>
                Total produzido no mês, independente das vendas.
              </p>
            </div>

            {/* Mini-stat: vendidas vs produzidas */}
            {m.totalUnitsProduced > 0 && (
              <div
                className="w-full rounded-xl px-4 py-3 flex justify-between text-xs"
                style={{ background: "oklch(0.96 0.008 75)" }}
              >
                <div className="text-center">
                  <p className="font-bold" style={{ color: "oklch(0.28 0.04 30)" }}>{m.totalUnitsSold}</p>
                  <p style={{ color: "oklch(0.55 0.02 30)" }}>Vendidas</p>
                </div>
                <div className="text-center">
                  <p className="font-bold" style={{ color: "oklch(0.28 0.04 30)" }}>
                    {m.totalUnitsProduced - m.totalUnitsSold > 0 ? m.totalUnitsProduced - m.totalUnitsSold : 0}
                  </p>
                  <p style={{ color: "oklch(0.55 0.02 30)" }}>Em estoque</p>
                </div>
                <div className="text-center">
                  <p className="font-bold" style={{ color: "oklch(0.42 0.15 160)" }}>
                    {m.totalUnitsProduced > 0
                      ? ((m.totalUnitsSold / m.totalUnitsProduced) * 100).toFixed(0)
                      : 0}%
                  </p>
                  <p style={{ color: "oklch(0.55 0.02 30)" }}>Taxa de giro</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
