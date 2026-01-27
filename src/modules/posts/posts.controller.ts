import { Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { PostsService } from "./posts.service";
import { AuthGuard } from "../auth/guards/auth.guard";

@Controller("/posts")
export class PostsController {
    constructor(
        private readonly postsService: PostsService
    ) {}

    @Post("/new")
    @UseGuards(AuthGuard)
    async createNewPost() {

    }

    @Patch("/:id/edit")
    @UseGuards(AuthGuard)
    async editPost(@Param("id", ParseIntPipe) postId: number) {
        
    }

    @Delete("/:id/delete")
    @UseGuards(AuthGuard)
    async deletePost(@Param("id", ParseIntPipe) postId: number) {
        
    }

    @Get("/")
    async getAllPosts() {

    }

    @Get("/from-user/:id")
    async getAllPostsFromUser(@Param("id", ParseIntPipe) userId: number) {

    }

    @Get("/:id")
    async getPost(@Param("id", ParseIntPipe) postId: number) {
        
    }
}