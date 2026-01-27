import { IsInt, Max, Min } from "class-validator";
import { ErrorCode } from "src/exception-filter/errors.enum";

export class PaginationDTO {
    @IsInt({message: ErrorCode.MUST_BE_INT})
    @Min(1, {message: ErrorCode.INVALID_PAGE_VALUE})
    page: number = 1;

    @IsInt()
    @Min(1, {message: ErrorCode.INVALID_PER_PAGE_VALUE})
    @Max(15, {message: ErrorCode.INVALID_PER_PAGE_VALUE})
    maxPerPage: number = 10;
}