import { cookies } from "next/headers"
import { verifyToken } from "./auth"

/**
 * Helper para verificar autenticação dentro de Server Actions.
 * Lança um erro se não houver sessão válida.
 */
export async function requireAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get("mdg_session")?.value

  if (!token) {
    throw new Error("Não autorizado: sessão não encontrada.")
  }

  const payload = await verifyToken(token)
  if (!payload) {
    throw new Error("Não autorizado: sessão inválida ou expirada.")
  }

  return payload
}
