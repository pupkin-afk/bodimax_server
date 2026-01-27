import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class TestService {
    constructor(
        private readonly prisma: PrismaService
    ) {};

    async refreshTokens() {
        return await this.prisma.refreshToken.findMany({});
    }

    async newreftoken() {
        return await this.prisma.refreshToken.create({
            data: {
                agent: "hz",
                expiresAt: new Date(Date.now() - 24 * 3600 * 1000),
                hash: "sadsadsadsa",
                ip: "0.0.0.0.0",
                userId: 1
            }
        })
    }
}