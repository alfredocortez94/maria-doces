"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { loginAction } from "@/server/actions/auth"

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
      toast.success("Acesso autorizado. Bem-vindo!")
      router.push("/")
      router.refresh()
    } else {
      toast.error("E-mail ou senha inválidos.")
    }
  }

  return (
    <div className="min-h-screen flex font-sans">

      {/* Painel esquerdo decorativo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-rose-600 via-pink-600 to-fuchsia-700 relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Círculos decorativos */}
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -right-10 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-0 w-48 h-48 rounded-full bg-white/5" />

        <div className="relative z-10 text-center">
          <div className="w-48 mx-auto mb-8">
            <Image
              src="/logo.png"
              alt="Maria Doce Gelado"
              width={240}
              height={180}
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            {[
              { label: "Controle de Produção", sub: "Lotes e ingredientes" },
              { label: "Gestão de Vendas", sub: "PDV integrado" },
              { label: "Ficha Técnica", sub: "Custo por receita" },
              { label: "DRE Automático", sub: "Lucros em tempo real" },
            ].map(item => (
              <div key={item.label} className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-pink-200 text-xs mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Painel direito: formulário */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image
              src="/logo.png"
              alt="Maria Doce Gelado"
              width={180}
              height={100}
              className="object-contain"
              priority
            />
          </div>

          {/* Cabeçalho */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Entrar no Sistema</h2>
            <p className="text-slate-500 mt-2 text-sm">Acesso restrito. Use suas credenciais de administrador.</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-10 pr-12 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-13 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-base shadow-lg shadow-pink-500/30 transition-all hover:shadow-pink-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2"
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

          {/* Aviso de segurança */}
          <div className="mt-6 flex items-start gap-3 bg-slate-100 rounded-xl p-4 border border-slate-200">
            <ShieldCheck size={18} className="text-slate-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Este sistema é de acesso exclusivo para administradores autorizados.
              Tentativas de acesso não autorizado são registradas para fins de auditoria.
            </p>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Maria Doce Gelado © {new Date().getFullYear()} · Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  )
}
