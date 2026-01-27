import { IsEmail, IsString } from "class-validator";
import { ErrorCode } from "src/exception-filter/errors.enum";

export class SendVerifyEmailDTO {
    @IsString({message: ErrorCode.MUST_BE_STRING})
    @IsEmail({}, {message: ErrorCode.MUST_BE_EMAIL})
    email: string;
}