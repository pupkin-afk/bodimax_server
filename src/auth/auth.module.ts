import { Module } from "@nestjs/common";
// import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "src/prisma/prisma.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtCookieStrategy } from "./strategies/jwt.strategy";
import { JwtModule } from "@nestjs/jwt";

const JWT_AGE = parseInt(process.env.ACCESS_TOKEN_AGE || "60000");

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: JWT_AGE }
        }),
        PrismaModule
    ],
    controllers: [AuthController],
    providers: [JwtCookieStrategy, AuthService]
})

export class AuthModule {};