"use server"

import { cookies } from "next/headers"
import { SignJWT } from "jose"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

function getAuthSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error(
      "[SEGURANÇA CRÍTICA] JWT_SECRET não está definido. Configure a variável de ambiente antes de usar o sistema."
    )
  }
  return new TextEncoder().encode(secret)
}

export async function loginAction(formData: FormData) {
  try {
    const email = (formData.get("email") as string)?.trim().toLowerCase()
    const password = formData.get("password") as string

    if (!email || !password) {
      return { success: false, error: "Preencha todos os campos" }
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Tempo constante para evitar user enumeration
      await bcrypt.hash("dummy_timing_protection", 10)
      return { success: false, error: "Credenciais inválidas" }
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return { success: false, error: "Credenciais inválidas" }
    }

    // Criar JWT com secret validado
    const token = await new SignJWT({ sub: user.id, email: user.email, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(getAuthSecret())

    const cookieStore = await cookies()
    cookieStore.set("mdg_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    })

    return { success: true }
  } catch (error: any) {
    // Não expor detalhes do erro para o cliente
    console.error("[Auth] Erro no login:", error)
    return { success: false, error: "Falha na autenticação. Tente novamente." }
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete("mdg_session")
  return { success: true }
}
