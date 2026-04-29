"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Mail, Eye, EyeOff, IceCream2, Sparkles, Package, BarChart3, DollarSign } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { loginAction } from "@/server/actions/auth"

const features = [
  { icon: IceCream2,  label: "Fichas Técnicas",     sub: "Custo por receita" },
  { icon: Package,    label: "Controle de Estoque",  sub: "Ingredientes e lotes" },
  { icon: DollarSign, label: "PDV Integrado",         sub: "Vendas em tempo real" },
  { icon: BarChart3,  label: "DRE Automático",        sub: "Lucro líquido do mês" },
]

export function LoginClient() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim() || !password) {
      toast.error("Preencha o e-mail e a senha.")
      return
    }
    setIsSubmitting(true)
    const formData = new FormData()
    formData.append("email", email.trim())
    formData.append("password", password)
    const res = await loginAction(formData)
    setIsSubmitting(false)
    if (res.success) {
      toast.success("Acesso autorizado. Bem-vinda!")
      router.push("/")
      router.refresh()
    } else {
      toast.error("E-mail ou senha inválidos.")
    }
  }

  return (
    <div className="min-h-screen flex font-sans">

      {/* ── Painel esquerdo artesanal ── */}
      <div
        className="hidden lg:flex lg:w-[46%] relative overflow-hidden flex-col items-center justify-center p-14 shrink-0"
        style={{
          background: "linear-gradient(155deg, oklch(0.30 0.11 348) 0%, oklch(0.20 0.08 338) 60%, oklch(0.17 0.06 330) 100%)",
        }}
      >
        {/* Grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />

        {/* Anéis decorativos concêntricos */}
        <div
          className="absolute rounded-full border border-white/[0.07]"
          style={{ width: 560, height: 560, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        />
        <div
          className="absolute rounded-full border border-white/[0.05]"
          style={{ width: 420, height: 420, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        />
        <div
          className="absolute rounded-full border border-white/[0.06]"
          style={{ width: 290, height: 290, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        />

        {/* Mancha de cor quente no canto */}
        <div
          className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background: "oklch(0.76 0.14 65)" }}
        />
        <div
          className="absolute -top-16 -left-16 w-56 h-56 rounded-full opacity-15 blur-3xl"
          style={{ background: "oklch(0.65 0.19 350)" }}
        />

        {/* Conteúdo */}
        <div className="relative z-10 flex flex-col items-center text-center">

          {/* Logo */}
          <div className="mb-8 animate-float">
            <Image
              src="/logo.png"
              alt="Maria Doce Gelado"
              width={200}
              height={140}
              className="object-contain drop-shadow-2xl"
              priority
              unoptimized
            />
          </div>

          {/* Tagline */}
          <p
            className="text-white/60 text-xl font-light italic leading-relaxed mb-10"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.01em" }}
          >
            "Feito com amor,<br />vendido com precisão."
          </p>

          {/* Features */}
          <div className="w-full max-w-[260px] space-y-2.5">
            {features.map(({ icon: Icon, label, sub }, i) => (
              <div
                key={label}
                className="flex items-center gap-3 px-4 py-3 rounded-xl animate-fade-up"
                style={{
                  background: "oklch(1 0 0 / 7%)",
                  border: "1px solid oklch(1 0 0 / 10%)",
                  animationDelay: `${i * 80 + 200}ms`,
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "oklch(0.76 0.12 65 / 30%)" }}
                >
                  <Icon size={14} style={{ color: "oklch(0.90 0.10 65)" }} />
                </div>
                <div className="text-left">
                  <p className="text-white/90 text-xs font-semibold leading-tight">{label}</p>
                  <p className="text-white/45 text-[11px] leading-tight mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Painel direito: formulário ── */}
      <div
        className="flex-1 flex flex-col justify-center items-center px-6 py-12"
        style={{ background: "oklch(0.985 0.008 75)" }}
      >
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image
              src="/logo.png"
              alt="Maria Doce Gelado"
              width={160}
              height={100}
              className="object-contain"
              priority
              unoptimized
            />
          </div>

          {/* Cabeçalho */}
          <div className="mb-8 animate-fade-up">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} style={{ color: "oklch(0.62 0.14 65)" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(0.62 0.14 65)" }}>
                Sistema Administrativo
              </span>
            </div>
            <h2
              className="text-3xl font-bold tracking-tight"
              style={{ color: "oklch(0.22 0.04 30)", fontFamily: "var(--font-display)" }}
            >
              Bem-vinda de volta
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: "oklch(0.50 0.02 30)" }}>
              Entre com suas credenciais para acessar o painel.
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-up" style={{ animationDelay: "80ms" }} autoComplete="on">

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold" style={{ color: "oklch(0.32 0.03 30)" }}>
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: "oklch(0.62 0.04 30)" }} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full h-12 pl-10 pr-4 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                  style={{
                    background: "oklch(1 0 0)",
                    border: "1px solid oklch(0.88 0.018 70)",
                    color: "oklch(0.22 0.04 30)",
                    "--tw-ring-color": "oklch(0.52 0.22 350 / 35%)",
                  } as React.CSSProperties}
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-semibold" style={{ color: "oklch(0.32 0.03 30)" }}>
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: "oklch(0.62 0.04 30)" }} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-10 pr-12 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                  style={{
                    background: "oklch(1 0 0)",
                    border: "1px solid oklch(0.88 0.018 70)",
                    color: "oklch(0.22 0.04 30)",
                    "--tw-ring-color": "oklch(0.52 0.22 350 / 35%)",
                  } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "oklch(0.62 0.04 30)" }}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl text-white font-bold text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2 shadow-lg"
              style={{
                background: "linear-gradient(135deg, oklch(0.50 0.22 350), oklch(0.57 0.22 345))",
                boxShadow: "0 4px 20px oklch(0.52 0.22 350 / 30%)",
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </span>
              ) : "Entrar no Sistema"}
            </button>
          </form>

          {/* Rodapé */}
          <p
            className="text-center text-xs mt-8 animate-fade-up"
            style={{ color: "oklch(0.60 0.02 30)", animationDelay: "200ms" }}
          >
            Maria Doce Gelado © {new Date().getFullYear()} · Acesso restrito a administradores
          </p>
        </div>
      </div>
    </div>
  )
}
