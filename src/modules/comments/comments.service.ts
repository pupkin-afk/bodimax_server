import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { NewCommentDTO } from "./dto/NewCommentDTO";
import { EditCommentDTO } from "./dto/EditCommentDTO";
import { ErrorCode } from "src/exception-filter/errors.enum";
import { FilterCommentsDTO } from "./dto/FilterCommentsDTO";

@Injectable()
export class CommentsService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    async createComment(dto: NewCommentDTO, authorId: number) {
        try {
            return await this.prisma.comment.create({
                data: {
                    content: dto.content,
                    parentId: dto.replyTo,
                    postId: dto.postId,
                    authorId,
                }
            });
        } catch {
            throw new BadRequestException({
                code: ErrorCode.INVALID_POST_OR_REPLY
            })
        }
    }

    async editComment(commentId: number, dto: EditCommentDTO, userId: number) {
        try {
            return await this.prisma.comment.update({
                where: {
                    id: commentId,
                    authorId: userId
                },
                data: {
                    content: dto.content,
                    editedAt: new Date()
                }
            });
        } catch {
            throw new NotFoundException({
                code: ErrorCode.INVALID_COMMENT
            })
        }
    }

    async deleteComment(commentId: number, userId: number) {
        try {
            return await this.prisma.comment.delete({
                where: {
                    id: commentId,
                    authorId: userId
                }
            });
        } catch {
            throw new NotFoundException({
                code: ErrorCode.INVALID_COMMENT
            })
        }
    }

    async getCommentsFromPost(postId: number, dto: FilterCommentsDTO) {
        
    }
}