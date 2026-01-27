import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDTO } from "./dtos/RegisterDTO";
import type { Request, Response } from "express";
import { NoAuthGuard } from "./guards/no-auth.guard";
import { LoginDTO } from "./dtos/LoginDTO";
import { AuthGuard } from "./guards/auth.guard";
import { UserId } from "./decorators/user-id.decorator";
import { ErrorCode } from "src/exception-filter/errors.enum";
import { SessionId } from "./decorators/session-id";
import { ChangePasswordDTO } from "./dtos/ChangePasswordDTO";
import { SendVerifyEmailDTO } from "./dtos/SendVerifyEmailDTO";
import { VerifyEmailDTO } from "./dtos/VerifyEmailDTO";

@Controller("auth")
export class AuthController {
    constructor(
        private readonly auth: AuthService
    ) {};

    @Post("register")
    @UseGuards(NoAuthGuard)
    async register(@Body() dto: RegisterDTO, @Res() res: Response, @Req() req: Request) {
        await this.auth.register(dto, res, req);
        res.status(HttpStatus.NO_CONTENT).end();
    }

    @Post("login")
    @UseGuards(NoAuthGuard)
    async login(@Body() dto: LoginDTO, @Res() res: Response, @Req() req: Request) {
        await this.auth.login(dto, res, req);
        res.status(HttpStatus.NO_CONTENT).end();
    }

    @Put("change-password")
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async changePassword(@Body() dto: ChangePasswordDTO, @UserId() userId: number) {
        await this.auth.changePassword(dto, userId);
    }

    @Post("send-verify-email")
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async sendVerifyEmail(@Body() dto: SendVerifyEmailDTO, @UserId() userId: number) {
        await this.auth.sendVerifyEmail(dto, userId);
    }

    @Post("verify-email")
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async verifyEmail(@Body() dto: VerifyEmailDTO) {
        await this.auth.verifyEmail(dto);
    }

    @Post("refresh-token")
    @UseGuards(AuthGuard)
    async refresh(@Req() req: Request, @Res() res: Response) {
        if (!req.cookies.refresh_token) {
            throw new UnauthorizedException({code: ErrorCode.REFRESH_TOKEN_INVALID})
        }
        await this.auth.rotateRefreshToken(req, res);
        res.status(HttpStatus.NO_CONTENT).end();
    }

    @Get("sessions")
    @UseGuards(AuthGuard)
    async getSessions(@UserId() usId: number, @SessionId() sId: number) {
        return await this.auth.getSessions(sId, usId);
    }

    @Delete("sessions/:id")
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async rejectSession(@Param("id", ParseIntPipe) sessionId: number, @SessionId() currentSessionId: number, @UserId() userId: number) {
        await this.auth.shutdownSession(userId, sessionId, currentSessionId);
    }

    @Post("logout")
    @UseGuards(AuthGuard)
    async logout(@Req() req: Request, @Res() res: Response) {
        await this.auth.logout(req, res);
        res.status(HttpStatus.NO_CONTENT).end();
    }

    @Post("logout-other-sessions")
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(AuthGuard)
    async logoutOtherSessions(@UserId() usId: number, @Req() req: Request) {
        await this.auth.logoutOtherSessions(usId, req);
    }
}