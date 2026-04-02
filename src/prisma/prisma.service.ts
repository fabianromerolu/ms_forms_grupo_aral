import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const base = process.env.DATABASE_URL ?? '';
    // Append connection pool params if not already present.
    // connection_limit=3  → Prisma queues all queries through ≤3 PG connections,
    //                        preventing "too many clients" on free-tier PostgreSQL.
    // pool_timeout=30     → Wait up to 30 s for a free slot before failing.
    const hasQuery = base.includes('?');
    const poolParams = 'connection_limit=2&pool_timeout=30';
    const url = base.includes('connection_limit')
      ? base
      : `${base}${hasQuery ? '&' : '?'}${poolParams}`;

    super({ datasources: { db: { url } } });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connection established (pool_limit=2, sequential queries)');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
