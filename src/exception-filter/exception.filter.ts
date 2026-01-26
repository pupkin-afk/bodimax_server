import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { type Response } from "express";
import { ErrorCode } from "./errors.enum";

@Catch(HttpException)
export class HttpErrorFilter implements ExceptionFilter {
    catch(e: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();

        const status = e.getStatus();
        const resp = e.getResponse();

        if (typeof resp === "object" && resp && 'codes' in resp) {
            return res.status(status).json({
                error_codes: resp.codes
            })
        }

        if (typeof resp === "object" && resp && 'code' in resp) {
            return res.status(status).json({
                error_codes: [resp.code]
            })
        }

        if (status === 404) {
            return res.status(404).json({
                error_codes: [ErrorCode.NOT_FOUND]
            });
        }

        return res.status(status).json({
            error_codes: [ErrorCode.UNKNOWN_ERROR]
        })
    }
}