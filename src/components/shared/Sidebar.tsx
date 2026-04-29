"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Home, Package, Activity, LogOut,
  DollarSign, IceCream2, BarChart3, Receipt, X,
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { logoutAction } from "@/server/actions/auth"
import { toast } from "sonner"

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { href: "/",        label: "Dashboard",             icon: Home },
    ],
  },
  {
    label: "Operacional",
    items: [
      { href: "/sabores",      label: "Sabores & Receitas",    icon: IceCream2 },
      { href: "/ingredientes", label: "Ingredientes & Estoque",icon: Package },
      { href: "/producao",     label: "Produção",              icon: Activity },
      { href: "/vendas",       label: "PDV Vendas",            icon: DollarSign },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { href: "/despesas",   label: "Despesas",   icon: Receipt },
      { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
    ],
  },
]

interface SidebarProps {
  isMobileOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isMobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await logoutAction()
    toast.success("Você saiu com segurança.")
    router.push("/login")
  }

  const sidebar = (
    <div
      className="flex flex-col w-64 h-full shrink-0"
      style={{
        background: "linear-gradient(175deg, oklch(0.33 0.115 350) 0%, oklch(0.23 0.085 340) 100%)",
      }}
    >
      {/* Logo */}
      <div
        className="px-5 py-5 flex flex-col items-center"
        style={{ borderBottom: "1px solid oklch(1 0 0 / 10%)" }}
      >
        <Image
          src="/logo.png"
          alt="Maria Doce Gelado"
          width={130}
          height={76}
          className="object-contain drop-shadow-md"
          priority
        />
      </div>

      {/* Navegação */}
      <div className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p
                className="text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5"
                style={{ color: "oklch(1 0 0 / 28%)" }}
              >
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item, i) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group animate-slide-in",
                      isActive
                        ? "text-white"
                        : "text-white/55 hover:text-white/90 hover:bg-white/[0.07]"
                    )}
                    style={{
                      background: isActive ? "oklch(1 0 0 / 13%)" : undefined,
                      borderLeft: isActive ? "2px solid oklch(0.76 0.12 65)" : "2px solid transparent",
                      paddingLeft: isActive ? "10px" : undefined,
                      animationDelay: `${(gi * 4 + i) * 35}ms`,
                    }}
                  >
                    <Icon
                      size={16}
                      className={cn(
                        "shrink-0 transition-colors",
                        isActive
                          ? "text-amber-400"
                          : "text-white/40 group-hover:text-white/75"
                      )}
                    />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé — logout */}
      <div className="p-3" style={{ borderTop: "1px solid oklch(1 0 0 / 10%)" }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-white/45 hover:text-white/80 hover:bg-white/[0.07]"
        >
          <LogOut size={16} className="shrink-0" />
          Sair do Sistema
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop: fixo */}
      <div className="hidden md:flex h-screen">
        {sidebar}
      </div>

      {/* Mobile: drawer com overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={onClose}
          />
          {/* Painel deslizante */}
          <div
            className="relative z-10 h-full animate-slide-in"
            style={{ animationDuration: "200ms" }}
          >
            {/* Botão fechar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-3 z-20 w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={15} />
            </button>
            {sidebar}
          </div>
        </div>
      )}
    </>
  )
}
