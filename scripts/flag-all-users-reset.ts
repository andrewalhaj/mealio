import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.user.updateMany({
    data: { mustResetPassword: true },
  })
  console.log(`Flagged ${result.count} user(s) for password reset.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
