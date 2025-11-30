import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const skipPrismaConnect = process.env.SKIP_PRISMA_CONNECT === 'true';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    if (skipPrismaConnect) {
      return;
    }
    await this.$connect();
  }
}
