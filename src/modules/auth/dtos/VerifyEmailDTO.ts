import { Type } from "class-transformer";
import { IsInt, IsString } from "class-validator";
import { ErrorCode } from "src/exception-filter/errors.enum";

export class VerifyEmailDTO {
    @IsInt({message: ErrorCode.MUST_BE_INT})
    @Type(() => Number)
    userId: number;

    @IsString({message: ErrorCode.MUST_BE_STRING})
    code: string;
}