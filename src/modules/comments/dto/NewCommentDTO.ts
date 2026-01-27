import { IsInt, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { ErrorCode } from "src/exception-filter/errors.enum";

export class NewCommentDTO {
    @IsString({message: ErrorCode.MUST_BE_STRING})
    @MinLength(1, {message: ErrorCode.INCORRECT_CONTENT_LENGTH})
    @MaxLength(500, {message: ErrorCode.INCORRECT_CONTENT_LENGTH})
    content: string;

    @IsInt({message: ErrorCode.MUST_BE_INT})
    postId: number

    @IsInt({message: ErrorCode.MUST_BE_INT})
    @IsOptional()
    replyTo?: number
}