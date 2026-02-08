import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { validateImgRatio } from 'src/common/helpers/imgsHelper';
import { AppConfig } from 'src/config/app.config';
import { ErrorCode } from 'src/exception-filter/errors.enum';
import { MinioService } from 'src/minio/minio.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EditUserDTO } from './dtos/EditUserDTO';
import { UsersFilterDTO } from './dtos/UsersFilterDTO';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  async me(userId: number) {
    return await this.getById(userId, userId, true);
  }

  async editUser(userId: number, dto: EditUserDTO) {
    if (dto.username) {
      const us = await this.prisma.user.findUnique({
        where: { username: dto.username },
        select: { id: true },
      });

      if (us) {
        throw new ConflictException({
          code: ErrorCode.USERNAME_TAKEN,
        });
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }

  async getById(id: number, meId?: number, isMe?: boolean) {
    const notMeAndAuth = id !== meId && meId;
    const [us, meFollowed, toMeFollowed] = await this.prisma.$transaction(
      async (tx) => {
        const userQuery = await tx.user.findUnique({
          where: { id },
          select: {
            firstName: true,
            lastName: true,
            username: true,
            id: true,
            createdAt: true,
            avatarUrl: true,
            coverUrl: true,
            _count: {
              select: {
                followed: true,
                followsTo: true,
                friends1: true,
                friends2: true,
                notifications: isMe
                  ? {
                      where: {
                        isChecked: false,
                      },
                    }
                  : undefined,
              },
            },
          },
        });

        const meFollowedCountQuery = notMeAndAuth
          ? await this.prisma.followShip.count({
              where: { followedId: meId, followedToInt: id },
            })
          : 0;

        const toMeFollowedCountQuery = notMeAndAuth
          ? await this.prisma.followShip.count({
              where: { followedId: id, followedToInt: meId },
            })
          : 0;

        return [userQuery, meFollowedCountQuery, toMeFollowedCountQuery];
      },
    );

    if (!us) {
      throw new NotFoundException({
        code: ErrorCode.NOT_EXISTING_USER,
      });
    }

    const { _count, ...rest } = us;

    return {
      ...rest,
      followedCount: _count.followed,
      followersCount: _count.followsTo,
      friendsCount: _count.friends1 + _count.friends2,
      notificationsCount: _count.notifications,
      isIFollowed: notMeAndAuth ? meFollowed === 1 : undefined,
      isMeFollowed: notMeAndAuth ? toMeFollowed === 1 : undefined,
    };
  }

  async filterUsers(dto: UsersFilterDTO) {
    const searchString = dto.searchString || '';
    const words = searchString.trim().split(/\s+/).slice(0, 3);

    if (words.length === 0) {
      words.push('');
    }

    try {
      const users = await this.prisma.user.findMany({
        where: {
          OR: words.flatMap((w) => [
            { firstName: { contains: w, mode: 'insensitive' } },
            { lastName: { contains: w, mode: 'insensitive' } },
            { username: { contains: w, mode: 'insensitive' } },
          ]),
        },
        select: {
          firstName: true,
          lastName: true,
          username: true,
          id: true,
          avatarUrl: true,
        },
        take: dto.take + 1,
        cursor: dto.cursor ? { id: dto.cursor } : undefined,
      });

      let nextCursor: number | null = null;
      if (users.length > dto.take) {
        nextCursor = users.pop()!.id;
      }

      return {
        results: users,
        nextCursor,
      };
    } catch {
      return {
        results: [],
        nextCursor: null,
      };
    }
  }

  async uploadAvatar(userId: number, file: Express.Multer.File) {
    await validateImgRatio(file.buffer, AppConfig.ratios.avatar_ratio);
    const url = `/avatars/${randomUUID()}_${file.originalname}`;

    try {
      await this.minio.upload(url, file.buffer, file.mimetype);
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          avatarUrl: url,
        },
      });
    } catch {
      throw new InternalServerErrorException({
        code: ErrorCode.SOMETHING_WENT_WRONG,
      });
    }

    return {
      newAvatarURL: url,
    };
  }

  async uploadCover(userId: number, file: Express.Multer.File) {
    await validateImgRatio(file.buffer, AppConfig.ratios.cover_ratio);
    const url = `/covers/${randomUUID()}_${file.originalname}`;

    try {
      await this.minio.upload(url, file.buffer, file.mimetype);
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          coverUrl: url,
        },
      });
    } catch {
      throw new InternalServerErrorException({
        code: ErrorCode.SOMETHING_WENT_WRONG,
      });
    }

    return {
      newCoverURL: url,
    };
  }
}
