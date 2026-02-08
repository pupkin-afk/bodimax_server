import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type { Request, Response } from 'express';
import Redis from 'ioredis';
import { clearAllCookies, setCookies } from 'src/common/helpers/cookiesHelper';
import {
  generate6DigitCode,
  generateString,
  hash256,
} from 'src/common/helpers/cryptoHelper';
import { AppConfig } from 'src/config/app.config';
import { ErrorCode } from 'src/exception-filter/errors.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { REDIS } from 'src/redis/redis.module';
import { NotificationsService } from '../notifications/notifcations.service';
import { ChangePasswordDTO } from './dtos/ChangePasswordDTO';
import { CheckForgotPassCodeDTO } from './dtos/CheckForgotPassCodeDTO';
import { LoginDTO } from './dtos/LoginDTO';
import { RegisterDTO } from './dtos/RegisterDTO';
import { ResetPasswordDTO } from './dtos/ResetPasswordDTO';
import { SendVerifyEmailDTO } from './dtos/SendVerifyEmailDTO';
import { VerifyEmailDTO } from './dtos/VerifyEmailDTO';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(REDIS) private readonly redis: Redis,
    private readonly mailer: MailerService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async login(dto: LoginDTO, res: Response, req: Request) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (!user) {
      throw new UnauthorizedException({ code: ErrorCode.BAD_CREDENTIALS });
    }

    const isPassValid = await bcrypt.compare(dto.password, user.password);

    if (!isPassValid) {
      throw new UnauthorizedException({ code: ErrorCode.BAD_CREDENTIALS });
    }

    await this.issueToken(user.id, res, req);
  }

  async register(dto: RegisterDTO, res: Response, req: Request) {
    let user: User;
    try {
      const hash = await bcrypt.hash(dto.password, 10);
      user = await this.prisma.user.create({
        data: {
          username: dto.username,
          firstName: dto.firstName,
          lastName: dto.lastName,
          password: hash,
        },
      });
      void this.notificationsService.pushWelcomeNotification(user.id);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code == 'P2002') {
        throw new ConflictException({ code: ErrorCode.USERNAME_TAKEN });
      }
      throw e;
    }

    await this.issueToken(user.id, res, req);
  }

  async changePassword(dto: ChangePasswordDTO, userId: number) {
    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException({
        code: ErrorCode.PASSWORDS_MUST_BE_DIFFERENT,
      });
    }

    const us = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    const isValidOldPswr = await bcrypt.compare(dto.oldPassword, us!.password);
    if (!isValidOldPswr) {
      throw new BadRequestException({
        code: ErrorCode.OLD_PASSWORD_INVALID,
      });
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: newHash,
      },
    });
  }

  async sendVerifyEmail(dto: SendVerifyEmailDTO, userId: number) {
    const ehash = await this.redis.get(`cc:${userId}`);
    const email = await this.redis.get(`cm:${userId}`);

    if (ehash || email) {
      throw new BadRequestException({
        code: ErrorCode.MAIN_ALREADY_SENT,
      });
    }

    const alreadyExistingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (alreadyExistingUser) {
      throw new ConflictException({
        code: ErrorCode.EMAIL_ALREADY_TAKEN,
      });
    }

    const us = await this.prisma.user.findFirst({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });
    if (us!.email) {
      throw new ConflictException({
        code: ErrorCode.EMAIL_ALREADY_HAVING,
      });
    }

    const code = generateString(32);
    const hash = hash256(code);

    const pipeline = this.redis.multi();
    pipeline.set(`cc:${userId}`, hash, 'EX', 15 * 60);
    pipeline.set(`cm:${userId}`, dto.email, 'EX', 15 * 60);

    const results = await pipeline.exec();
    if (!results || results.some(([err, res]) => err || res !== 'OK')) {
      throw new InternalServerErrorException({
        code: ErrorCode.SERVER_ERROR,
      });
    }

    try {
      const us = await this.prisma.user.findFirst({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });
      const link =
        process.env.FRONTEND_URL +
        '/verify-email/?userId=' +
        userId +
        '&' +
        'code=' +
        encodeURI(code);

      await this.mailer.sendMail({
        to: dto.email,
        subject: 'Confirm your email',
        template: 'confirm_email',
        context: {
          name: `${us!.firstName} ${us!.lastName}`,
          link,
        },
      });
    } catch {
      throw new InternalServerErrorException({
        code: ErrorCode.SERVER_ERROR,
      });
    }
  }

  async verifyEmail(dto: VerifyEmailDTO) {
    const hash = await this.redis.get(`cc:${dto.userId}`);
    const email = await this.redis.get(`cm:${dto.userId}`);

    if (!hash || !email) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
      });
    }

    if (hash256(dto.code) !== hash) {
      throw new BadRequestException({
        code: ErrorCode.INCORRECT_VERIFY_CODE,
      });
    }

    await this.prisma.user.update({
      where: { id: dto.userId },
      data: { email },
    });

    await this.redis.del(`cc:${dto.userId}`);
    await this.redis.del(`cm:${dto.userId}`);
  }

  async sendForgotPasswordEmail(dto: SendVerifyEmailDTO) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND_USER_WITH_THIS_EMAIL,
      });
    }

    const ehash = await this.redis.get(`fc:${user.id}`);
    const isVerified = await this.redis.get(`fv:${user.id}`);
    if (ehash || isVerified) {
      throw new BadRequestException({
        code: ErrorCode.MAIN_ALREADY_SENT,
      });
    }

    const code = generate6DigitCode();
    const hash = hash256(code);

    const pipeline = this.redis.multi();

    pipeline.set(`fc:${user.id}`, hash, 'EX', 15 * 60);
    pipeline.set(`fr:${user.id}`, 0, 'EX', 15 * 60);

    const results = await pipeline.exec();
    if (!results || results.some(([err, res]) => err || res !== 'OK')) {
      throw new InternalServerErrorException({
        code: ErrorCode.SERVER_ERROR,
      });
    }

    try {
      await this.mailer.sendMail({
        to: dto.email,
        subject: 'Reset password',
        template: 'forgot_password',
        context: {
          name: `${user.firstName} ${user.lastName}`,
          code,
        },
      });
    } catch {
      throw new InternalServerErrorException({
        code: ErrorCode.SERVER_ERROR,
      });
    }
  }
  async checkForgotPasswordCode(dto: CheckForgotPassCodeDTO) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND_USER_WITH_THIS_EMAIL,
      });
    }

    const hash = await this.redis.get(`fc:${user.id}`);
    const retries = parseInt((await this.redis.get(`fr:${user.id}`)) || '');
    if (!hash || retries === null || retries === undefined || isNaN(retries)) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
      });
    }

    if (retries >= 3) {
      await this.redis.del(`fc:${user.id}`);
      await this.redis.del(`fr:${user.id}`);
      throw new HttpException(
        {
          code: ErrorCode.ATTEMPTS_OVER,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (hash256(dto.code) !== hash) {
      await this.redis.incr(`fr:${user.id}`);
      throw new BadRequestException({
        code: ErrorCode.INCORRECT_CODE,
      });
    }

    const pipe = this.redis.multi();

    pipe.del(`fc:${user.id}`);
    pipe.del(`fr:${user.id}`);
    pipe.set(`fv:${user.id}`, 1, 'EX', 15 * 60);

    await pipe.exec();

    return {
      correct: true,
    };
  }
  async confirmResetPassword(
    dto: ResetPasswordDTO,
    res: Response,
    req: Request,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, username: true },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND_USER_WITH_THIS_EMAIL,
      });
    }

    const isVerified = await this.redis.get(`fv:${user.id}`);
    if (!isVerified) {
      throw new BadRequestException({
        code: ErrorCode.CODE_NOT_VERIFIED_OR_EXPIRED,
      });
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);

    await this.redis.del(`fv:${user.id}`);
    await this.prisma.user.update({
      where: { email: dto.email },
      data: {
        password: newHash,
      },
    });

    await this.login(
      {
        username: user.username,
        password: dto.newPassword,
      },
      res,
      req,
    );
  }

  async logout(req: Request, res: Response) {
    try {
      const token = req.cookies?.refresh_token as string;
      await this.prisma.refreshToken.delete({
        where: { hash: token },
      });
    } finally {
      clearAllCookies(res);
    }
  }

  async logoutOtherSessions(userId: number, req: Request) {
    const token = req.cookies?.refresh_token as string;
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        NOT: { hash: token },
      },
    });
  }

  async rotateRefreshToken(req: Request, res: Response) {
    const tokenHash = req.cookies?.refresh_token as string;
    const tok = await this.prisma.refreshToken.findUnique({
      where: { hash: tokenHash },
    });

    if (!tok || tok.expiresAt < new Date()) {
      clearAllCookies(res);
      if (tok) {
        await this.prisma.refreshToken.delete({
          where: { id: tok.id },
        });
      }
      throw new UnauthorizedException({
        code: ErrorCode.REFRESH_TOKEN_INVALID,
      });
    }

    await this.issueToken(tok.userId, res, req, tok.id);
  }

  async getSessions(sessionId: number, userId: number) {
    const list = await this.prisma.refreshToken.findMany({
      where: { userId },
      omit: { hash: true, userId: true },
    });
    return list.map((el) => ({ ...el, isCurrentSession: el.id === sessionId }));
  }

  async shutdownSession(
    userId: number,
    sessionId: number,
    currentSessionId: number,
  ) {
    if (sessionId === currentSessionId) {
      throw new BadRequestException({
        code: ErrorCode.CANNOT_SHUTDOWN_CURRENT_SESSION,
      });
    }

    try {
      await this.prisma.refreshToken.delete({
        where: { id: sessionId, userId },
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException({
          code: ErrorCode.INVALID_SESSION,
        });
      }
    }
  }

  async issueToken(
    userId: number,
    res: Response,
    req: Request,
    refreshTokenId?: number,
  ) {
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + AppConfig.REFRESH_TOKEN_AGE);

    const hIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.ip ||
      req.socket.remoteAddress;
    const agent = req.headers['user-agent'] || 'unknown';

    let ip = '0.0.0.0';
    if (hIp && Array.isArray(hIp)) {
      ip = hIp[0];
    } else if (hIp) {
      ip = hIp;
    }

    if (!refreshTokenId) {
      const tok = await this.prisma.refreshToken.create({
        data: {
          userId,
          hash: refreshToken,
          expiresAt,
          ip,
          agent,
        },
      });
      refreshTokenId = tok.id;
    } else {
      await this.prisma.refreshToken.update({
        where: { id: refreshTokenId },
        data: {
          hash: refreshToken,
          expiresAt,
          ip,
          agent,
        },
      });
    }

    const accessToken = this.jwt.sign({ sessionId: refreshTokenId });
    setCookies(res, accessToken, refreshToken);
  }
}
