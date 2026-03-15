"use client"

import { Menu } from "lucide-react"

function getCurrentMonthLabel() {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date())
}

export function Header() {
  const monthLabel = getCurrentMonthLabel()
  const capitalizedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  return (
    <header
      className="h-16 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10 w-full"
      style={{
        background: "oklch(0.985 0.008 75)",
        borderBottom: "1px solid oklch(0.91 0.015 70 / 60%)",
      }}
    >
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button className="md:hidden text-slate-500 hover:text-slate-700">
          <Menu size={24} />
        </button>

        <div className="hidden md:flex flex-col">
          <h2 className="text-base font-semibold leading-tight" style={{ color: "oklch(0.25 0.04 30)", fontFamily: "var(--font-display)" }}>
            Visão Geral do Negócio
          </h2>
          <p className="text-xs" style={{ color: "oklch(0.52 0.08 65)" }}>
            {capitalizedMonth}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex flex-col text-sm text-right">
          <span className="font-semibold" style={{ color: "oklch(0.30 0.04 30)" }}>Administradora</span>
          <span className="text-xs font-medium" style={{ color: "oklch(0.52 0.22 350)" }}>Maria Doce</span>
        </div>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm"
          style={{ background: "linear-gradient(135deg, oklch(0.62 0.22 350), oklch(0.72 0.14 65))" }}
        >
          MD
        </div>
      </div>
    </header>
  )
}
