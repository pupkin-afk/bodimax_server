import { Module } from "@nestjs/common";
import { AuthModule } from "src/modules/auth/auth.module";
import { PrismaModule } from "src/prisma/prisma.module";
import { TestService } from "./test.service";
import { TestController } from "./test.controller";

// This module ONLY for tests.

@Module({
    imports: [
        PrismaModule,
        AuthModule
    ],
    providers: [TestService],
    controllers: [TestController]
})
export class TestModule {};