import { SignJWT, jwtVerify } from "jose"

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_maria_doce_123_456_789")

export async function signToken(payload: any) {
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
