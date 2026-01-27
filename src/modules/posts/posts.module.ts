import { Module } from "@nestjs/common";
import { PostsService } from "./posts.service";
import { PostsController } from "./posts.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";

@Module({
    imports: [
        PrismaModule,
        AuthModule
    ],
    providers: [PostsService],
    controllers: [PostsController]
})
export class PostsModule {};