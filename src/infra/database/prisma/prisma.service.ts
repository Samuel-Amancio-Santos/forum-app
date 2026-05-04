import { PrismaClient } from '@/generated/prisma/client'
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'

import 'dotenv/config'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = `${process.env.DATABASE_URL}`

    // O ?schema= é ignorado pelo driver pg — precisa ser extraído e
    // passado explicitamente como segundo argumento do PrismaPg
    const url = new URL(connectionString)
    const schema = url.searchParams.get('schema') ?? 'public'
    url.searchParams.delete('schema') // remove para não confundir o pg

    const adapter = new PrismaPg(
      { connectionString: url.toString() },
      { schema }, // ← aqui o schema é aplicado corretamente via search_path
    )

    super({ adapter })
  }

  onModuleInit() {
    return this.$connect()
  }

  onModuleDestroy() {
    return this.$disconnect()
  }
}
