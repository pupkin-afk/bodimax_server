import { IntersectionType } from "@nestjs/mapped-types";
import { IsOptional, IsString } from "class-validator";
import { PaginationDTO } from "src/common/dtos/PaginationDTO";
import { ErrorCode } from "src/exception-filter/errors.enum";

class SearchDTO {
    @IsString({ message: ErrorCode.MUST_BE_STRING })
    @IsOptional()
    searchString?: string;
}

export class UsersFilterDTO extends IntersectionType(SearchDTO, PaginationDTO) {};

// export class UsersFilterDTO {
//     @IsString({ message: ErrorCode.MUST_BE_STRING })
//     @IsOptional()
//     searchString?: string;

//     @IsInt({message: ErrorCode.MUST_BE_INT})
//     @IsOptional()
//     page?: number;

//     @IsInt({message: ErrorCode.MUST_BE_INT})
//     @IsOptional()
//     maxPerPage?: number;
// }