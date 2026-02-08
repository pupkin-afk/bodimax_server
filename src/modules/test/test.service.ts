import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from 'src/prisma/prisma.service';
import { REDIS } from 'src/redis/redis.module';

@Injectable()
export class TestService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
    private readonly mailerService: MailerService,
  ) {}

  refreshTokens() {
    return { started: true };
  }

  async newreftoken() {
    const plan = await this.prisma.$queryRawUnsafe(`
  EXPLAIN ANALYZE
  SELECT "id", "createdAt" FROM "Post"
  WHERE "authorId" = 1
  ORDER BY "createdAt" DESC, "id" DESC
  LIMIT 10;
`);
    return plan;
  }
}
