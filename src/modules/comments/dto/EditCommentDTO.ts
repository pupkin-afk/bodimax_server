import { OmitType, PartialType } from "@nestjs/mapped-types";
import { NewCommentDTO } from "./NewCommentDTO";

export class EditCommentDTO extends PartialType(
    OmitType(NewCommentDTO, ["postId", "replyTo"])
) {};