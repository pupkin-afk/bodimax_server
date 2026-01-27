import { Controller, Get, Post } from "@nestjs/common";
import { TestService } from "./test.service";

@Controller("test")
export class TestController {
    constructor(
        private readonly testService: TestService
    ) {};

    @Get("/refresh-tokens")
    async getRefreshTokens() {
        return await this.testService.refreshTokens();
    }

    @Post("/new-ref-token")
    async newreftoken() {
        return await this.testService.newreftoken();
    }
}