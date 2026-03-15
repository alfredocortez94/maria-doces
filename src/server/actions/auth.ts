"use server"

import { cookies } from "next/headers"
import { SignJWT } from "jose"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_maria_doce_123_456_789")

export async function loginAction(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      return { success: false, error: "Preencha todos os campos" }
    }

    // Auto-seed for MVP if no users exist
    const userCount = await prisma.user.count()
    if (userCount === 0) {
      const hash = await bcrypt.hash("admin123", 10)
      await prisma.user.create({
        data: {
          name: "Administrador(a)",
          email: "admin@mariadoce.com",
          passwordHash: hash,
          role: "ADMIN"
        }
      })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return { success: false, error: "Credenciais inválidas" }
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return { success: false, error: "Credenciais inválidas" }
    }

    // Create JWT
    const token = await new SignJWT({ sub: user.id, email: user.email, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(getSecret())

    // Set HTTP-only Cookie
    // Em Next.js >= 15 a API de headers é assíncrona
    const cookieStore = await cookies()
    cookieStore.set("mdg_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Erro interno" }
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete("mdg_session")
  return { success: true }
}
