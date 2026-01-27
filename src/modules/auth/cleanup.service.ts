import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AuthCleanupService {
    private readonly logger = new Logger(AuthCleanupService.name);

    constructor(
        private readonly prisma: PrismaService
    ) {}

    @Cron("*/1 * * * *")
    async clearExpiredTokens() {
        const c = await this.prisma.refreshToken.deleteMany({
            where: {
                expiresAt: {lt: new Date()}
            }
        });
        
        this.logger.log(`Cleaned ${c.count} refresh token${c.count !== 1 ? "s" : ""}.`);
    }
}