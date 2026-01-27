import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtCookieStrategy } from "./strategies/jwt.strategy";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthCleanupService } from "./cleanup.service";
import { RedisModule } from "src/redis/redis.module";
import { MailerModule } from "src/mailer/mailer.module";

@Module({
    imports: [
        PrismaModule,
        ScheduleModule.forRoot(),
        RedisModule,
        MailerModule
    ],
    controllers: [AuthController],
    providers: [JwtCookieStrategy, AuthService, AuthCleanupService]
})

export class AuthModule {};