"use client"

import { Menu } from "lucide-react"
import { usePathname } from "next/navigation"

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/":             { title: "Painel de Controle",    subtitle: "Resumo financeiro e operacional do mês atual" },
  "/sabores":      { title: "Sabores & Receitas",     subtitle: "Fichas técnicas, custos e rendimento por lote" },
  "/ingredientes": { title: "Ingredientes & Estoque", subtitle: "Controle de insumos e movimentações de stock" },
  "/producao":     { title: "Produção",               subtitle: "Registro e acompanhamento dos lotes fabricados" },
  "/vendas":       { title: "PDV · Vendas",           subtitle: "Frente de caixa e histórico de transações" },
  "/despesas":     { title: "Despesas",               subtitle: "Registro de custos e despesas operacionais" },
  "/relatorios":   { title: "Relatórios",             subtitle: "Análise financeira detalhada do período" },
}

function getCurrentMonthLabel() {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date())
}

export function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const pathname = usePathname()
  const meta = PAGE_META[pathname] ?? PAGE_META["/"]
  const monthLabel = getCurrentMonthLabel()
  const capitalizedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  return (
    <header
      className="h-16 flex items-center justify-between px-5 md:px-8 shrink-0 sticky top-0 z-30 w-full"
      style={{
        background: "oklch(0.985 0.008 75 / 90%)",
        borderBottom: "1px solid oklch(0.91 0.015 70 / 60%)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Botão mobile — funcional */}
        <button
          onClick={onMenuToggle}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-black/5"
          aria-label="Abrir menu"
        >
          <Menu size={22} style={{ color: "oklch(0.42 0.04 30)" }} />
        </button>

        <div className="flex flex-col min-w-0">
          <h1
            className="text-base font-bold leading-tight truncate"
            style={{ color: "oklch(0.22 0.04 30)", fontFamily: "var(--font-display)" }}
          >
            {meta.title}
          </h1>
          <p className="text-[11px] leading-tight truncate hidden sm:block" style={{ color: "oklch(0.55 0.05 65)" }}>
            {meta.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Período */}
        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs font-medium" style={{ color: "oklch(0.42 0.03 30)" }}>
            {capitalizedMonth}
          </span>
        </div>

        {/* Divisor */}
        <div className="hidden md:block w-px h-6" style={{ background: "oklch(0.88 0.015 70)" }} />

        {/* Avatar + nome */}
        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs font-semibold leading-tight" style={{ color: "oklch(0.28 0.04 30)" }}>
            Maria Doce
          </span>
          <span className="text-[11px] leading-tight" style={{ color: "oklch(0.52 0.22 350)" }}>
            Administradora
          </span>
        </div>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0"
          style={{ background: "linear-gradient(135deg, oklch(0.52 0.22 350), oklch(0.62 0.18 350))" }}
        >
          MD
        </div>
      </div>
    </header>
  )
}
