"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { Home, Package, Activity, LogOut, DollarSign, IceCream2, BarChart3, Receipt } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { logoutAction } from "@/server/actions/auth"
import { toast } from "sonner"

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/sabores", label: "Sabores & Receitas", icon: IceCream2 },
  { href: "/ingredientes", label: "Ingredientes & Estoque", icon: Package },
  { href: "/producao", label: "Produção", icon: Activity },
  { href: "/vendas", label: "PDV Vendas", icon: DollarSign },
  { href: "/despesas", label: "Despesas", icon: Receipt },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await logoutAction()
    toast.success("Você saiu com segurança.")
    router.push("/login")
  }

  return (
    <div
      className="flex flex-col w-64 min-h-screen hidden md:flex shrink-0"
      style={{
        background: "linear-gradient(180deg, oklch(0.34 0.12 350) 0%, oklch(0.24 0.09 340) 100%)",
      }}
    >
      {/* Logo */}
      <div className="px-4 py-5 flex flex-col items-center border-b" style={{ borderColor: "oklch(1 0 0 / 10%)" }}>
        <Image
          src="/logo.jpg"
          alt="Maria Doce Gelado"
          width={140}
          height={80}
          className="object-contain drop-shadow-md"
          priority
        />
      </div>

      {/* Navegação */}
      <div className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item, i) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group animate-slide-in",
                isActive
                  ? "text-white border-l-2 border-amber-400 pl-[10px]"
                  : "text-white/65 hover:text-white"
              )}
              style={{
                background: isActive ? "oklch(1 0 0 / 14%)" : undefined,
                animationDelay: `${i * 40}ms`,
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "oklch(1 0 0 / 8%)"
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = ""
              }}
            >
              <Icon
                size={17}
                className={cn(
                  "transition-colors shrink-0",
                  isActive ? "text-amber-400" : "text-white/50 group-hover:text-white/80"
                )}
              />
              {item.label}
            </Link>
          )
        })}
      </div>

      <div className="p-3 border-t" style={{ borderColor: "oklch(1 0 0 / 10%)" }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-white/50 hover:text-white/90"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "oklch(1 0 0 / 8%)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "" }}
        >
          <LogOut size={17} />
          Sair
        </button>
      </div>
    </div>
  )
}
