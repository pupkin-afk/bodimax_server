import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ErrorCode } from "src/exception-filter/errors.enum";
import { PrismaService } from "src/prisma/prisma.service";
import { UsersFilterDTO } from "./dtos/UsersFilterDTO";
import { EditUserDTO } from "./dtos/EditUserDTO";

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService
    ) {};

    async me(userId: number) {
        return await this.prisma.user.findUnique({
            where: {id: userId},
            omit: {
                password: true
            }
        });
    }

    async editUser(userId: number, dto: EditUserDTO) {
        if (dto.username) {
            const us = await this.prisma.user.findUnique({
                where: { username: dto.username },
                select: { id: true }
            });

            if (us) {
                throw new ConflictException({
                    code: ErrorCode.USERNAME_TAKEN
                });
            }
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: dto
        });
    }

    async getByUsername(username: string) {
        const us = await this.prisma.user.findUnique({
            where: { username },
            omit: {
                password: true
            }
        });
        
        if (!us) {
            throw new NotFoundException({
                code: ErrorCode.NOT_EXISTING_USER
            })
        }

        return us;
    }

    async getById(id: number) {
        const us = await this.prisma.user.findUnique({
            where: { id },
            omit: {
                password: true
            }
        });

        if (!us) {
            throw new NotFoundException({
                code: ErrorCode.NOT_EXISTING_USER
            })
        }

        return us;
    }

    async filterUsers(dto: UsersFilterDTO) {
        const take = dto.maxPerPage;
        const page = dto.page-1;
        const searchString = dto.searchString || "";
        const words = searchString
                    .trim()
                    .split(/\s+/)
                    .slice(0, 3);

        // if (take > 15 || take < 1) {
        //     take = 10;
        // }
        // if (page < 0) {
        //     page = 0;
        // }

        if (words.length === 0) {
            words.push('');
        }

        return await this.prisma.user.findMany({
            where: {
                OR: words.flatMap((w) => [
                    { firstName: { contains: w, mode: "insensitive" } },
                    { lastName: { contains: w, mode: "insensitive" } },
                    { username: { contains: w, mode: "insensitive" } },
                ])
                // OR: [
                //     { firstName: { contains: ["iva", "drem"], mode: "insensitive" } },
                //     { lastName: { contains: searchString, mode: "insensitive" } },
                //     { username: { contains: searchString, mode: "insensitive" } },
                // ]
            },
            select: {
                firstName: true, lastName: true, username: true, id: true
            },
            orderBy: { username: "asc" },
            take,
            skip: page * take
        });
    }
}