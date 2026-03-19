import { SignJWT, jwtVerify } from "jose"

// 🟡 FIX: Explicit payload type — was `any`, allowing sensitive fields to accidentally end up in JWT
export type JWTPayload = {
  sub: string
  email: string
  role: string
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error(
      "[SEGURANÇA CRÍTICA] JWT_SECRET não está definido nas variáveis de ambiente. " +
      "Defina-o antes de iniciar a aplicação."
    )
  }
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: JWTPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret())
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch (error) {
    return null
  }
}
