import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { AuthGuard } from "../auth/guards/auth.guard";
import { NewCommentDTO } from "./dto/NewCommentDTO";
import { UserId } from "../auth/decorators/user-id.decorator";
import { EditCommentDTO } from "./dto/EditCommentDTO";
import { FilterCommentsDTO } from "./dto/FilterCommentsDTO";

@Controller("/comments")
export class CommentsController {
    constructor(
        private readonly commentsService: CommentsService
    ) {};

    @Post("/create")
    @UseGuards(AuthGuard)
    async createComment(@Body() dto: NewCommentDTO, @UserId() userId: number) {
        return await this.commentsService.createComment(dto, userId);
    }

    @Patch("/:id/edit")
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async editComment(@Param("id", ParseIntPipe) commentId: number, @Body() dto: EditCommentDTO, @UserId() userId: number) {
        await this.commentsService.editComment(commentId, dto, userId);
    }

    @Delete("/:id/delete")
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteComment(@Param("id", ParseIntPipe) commentId: number, @UserId() userId: number) {
        await this.commentsService.deleteComment(commentId, userId);
    }

    @Get("/from-post/:id")
    async getCommentsFromPost(@Param("id", ParseIntPipe) postId: number, @Query() dto: FilterCommentsDTO) {
        return await this.commentsService.getCommentsFromPost(postId, dto);
    }
}