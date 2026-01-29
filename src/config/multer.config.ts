import { BadRequestException } from "@nestjs/common";
import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import { ErrorCode } from "src/exception-filter/errors.enum";

const MIMETYPE_PRESETS = {
    ONLY_IMAGES: ['image/png', 'image/jpeg', 'image/webp']
};

type Opts = {
    maxFileSize?: number;
    allowedMimeTypes?: string[]
}
const makeConfig = (opts: Opts): MulterOptions => ({
    limits: {
        fileSize: opts.maxFileSize
    },
    fileFilter(req, file, cb) {
        const allowed = opts.allowedMimeTypes;

        if (allowed && !allowed.includes(file.mimetype)) {
            return cb(
                new BadRequestException({
                    code: ErrorCode.INVALID_FILE_FORMAT
                }),
                false,
            );
        }

        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');

        cb(null, true);
    }
})

export const imgUploadConfig: MulterOptions = makeConfig({
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: MIMETYPE_PRESETS.ONLY_IMAGES
});

export const anyFileUploadConfig: MulterOptions = makeConfig({
    maxFileSize: 100 * 1024 * 1024
});