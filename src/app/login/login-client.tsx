"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { IceCream2, Lock, Mail } from "lucide-react"
import { toast } from "sonner"
import { loginAction } from "@/server/actions/auth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function LoginClient() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    const res = await loginAction(formData)
    setIsSubmitting(false)

    if (res.success) {
      toast.success("Login efetuado com sucesso!")
      router.push("/")
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4 text-pink-500 bg-white w-24 h-24 rounded-full items-center shadow-lg border-4 border-pink-100 mx-auto">
           <IceCream2 size={48} />
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-slate-800">
          Maria Doce Gelado
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Acesso restrito à gestão do negócio
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-pink-100 sm:rounded-2xl sm:px-10">
          <form action={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email Admin</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input 
                  name="email" 
                  type="email" 
                  required 
                  className="pl-10 h-12 bg-slate-50 border-slate-200" 
                  placeholder="admin@mariadoce.com"
                  defaultValue="admin@mariadoce.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Senha</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input 
                  name="password" 
                  type="password" 
                  required 
                  className="pl-10 h-12 bg-slate-50 border-slate-200" 
                  placeholder="********"
                  defaultValue="admin123"
                />
              </div>
            </div>

            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 mt-2">
              <p className="text-xs text-blue-700 leading-tight">
                <b>Seed Automático MVP:</b> O primeiro acesso no banco vazio configurará automaticamente <b>admin@mariadoce.com</b> com a senha <b>admin123</b>.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-bold bg-pink-600 hover:bg-pink-500 shadow-lg shadow-pink-900/30 text-white mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Autenticando..." : "Entrar no Gestor"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
