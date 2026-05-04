import 'dotenv/config'
import { config } from 'dotenv'

import { randomUUID } from 'node:crypto'
import { execSync } from 'node:child_process'
import { PrismaService } from '@/src/infra/database/prisma/prisma.service'

config({ path: '.env.test', override: true })

const prisma = new PrismaService()

function generateUniqueDatabaseURL(schemaId: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error('Please provider a DATABASE_URL environment variable')
  }

  const url = new URL(process.env.DATABASE_URL)

  url.searchParams.set('schema', schemaId)

  return url.toString()
}

const schemaId = randomUUID()

beforeAll(async () => {
  const databaseURL = generateUniqueDatabaseURL(schemaId)

  process.env.DATABASE_URL = databaseURL

  execSync('npx prisma migrate deploy')
})

afterAll(async () => {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`)
  await prisma.onModuleDestroy()
})
