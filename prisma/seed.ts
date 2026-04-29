/**
 * Script de seed seguro para criar o primeiro usuário admin.
 * Executar via: npx tsx prisma/seed.ts
 * OU configurar no package.json: "prisma.seed": "tsx prisma/seed.ts"
 */

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@mariadoce.com"
  const password = process.env.ADMIN_PASSWORD

  if (!password) {
    console.error("\n❌ Erro: defina a variável de ambiente ADMIN_PASSWORD antes de rodar o seed.")
    console.error("   Exemplo: ADMIN_PASSWORD=suasenha npx tsx prisma/seed.ts\n")
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      name: "Administrador(a)",
      email,
      passwordHash,
      role: "ADMIN"
    }
  })

  console.log(`\n✅ Usuário admin atualizado/criado com sucesso!`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Role:  ${user.role}\n`)
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
