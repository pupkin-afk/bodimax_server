import { IntersectionType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import { IsInt, IsOptional } from "class-validator";
import { PaginationDTO } from "src/common/dtos/PaginationDTO";
import { ErrorCode } from "src/exception-filter/errors.enum";

export class Filter {
    @IsInt({message: ErrorCode.MUST_BE_INT})
    @IsOptional()
    @Type(() => Number)
    parentId: number
}

export class FilterCommentsDTO extends IntersectionType(PaginationDTO, Filter) {};