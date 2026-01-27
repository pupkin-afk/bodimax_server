import { IsString, MaxLength, MinLength } from "class-validator";
import { ErrorCode } from "src/exception-filter/errors.enum";

export class ChangePasswordDTO {
    @IsString({message: ErrorCode.MUST_BE_STRING})
    oldPassword: string;

    @IsString({message: ErrorCode.MUST_BE_STRING})
    @MinLength(5, {message: ErrorCode.PASSWORD_SHORT_LENGTH})
    @MaxLength(50, {message: ErrorCode.PASSWORD_LONG_LENGTH})
    newPassword: string;
}