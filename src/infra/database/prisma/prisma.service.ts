import { PrismaClient } from '@/generated/prisma/client';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg';

import "dotenv/config";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
       const connectionString = `${process.env.DATABASE_URL}`;
       const adapter = new PrismaPg({ connectionString });

      super({adapter})

  }

   onModuleInit() {
       return this.$connect()
  }


    onModuleDestroy() {
     return this.$disconnect()
  }
}
