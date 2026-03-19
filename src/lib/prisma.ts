import { PrismaClient } from "@prisma/client"

const prismaClientSingleton = () => {
  return new PrismaClient({
    // 🟢 FIX: Enable structured logging. In dev, log queries for debugging; in prod, only errors/warnings.
    log: process.env.NODE_ENV === "production"
      ? ["error", "warn"]
      : ["query", "warn", "error"]
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma
