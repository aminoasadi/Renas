import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { ZodError } from "zod";
import { ApiErrorCode, type ApiErrorBody } from "@renas/shared";

/**
 * Every thrown error — HttpException, a raw ZodError, or anything
 * unexpected — is normalized into the `{ error: { code, message, details } }`
 * shape here, and production responses never include a stack trace.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const isProd = process.env.APP_ENV === "production";

    if (exception instanceof ZodError) {
      const body: ApiErrorBody = {
        error: {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: "Invalid request",
          details: exception.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      };
      response.status(HttpStatus.BAD_REQUEST).json(body);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : ((exceptionResponse as { message?: string })?.message ?? exception.message);

      const body: ApiErrorBody = {
        error: {
          code: mapStatusToCode(status),
          message: Array.isArray(message) ? message.join(", ") : message,
          details: typeof exceptionResponse === "object" ? exceptionResponse : undefined,
        },
      };
      response.status(status).json(body);
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    const body: ApiErrorBody = {
      error: {
        code: ApiErrorCode.INTERNAL_ERROR,
        message: isProd ? "Internal server error" : String((exception as Error)?.message ?? exception),
      },
    };
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}

function mapStatusToCode(status: number): string {
  switch (status) {
    case HttpStatus.UNAUTHORIZED:
      return ApiErrorCode.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return ApiErrorCode.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return ApiErrorCode.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return ApiErrorCode.CONFLICT;
    case HttpStatus.TOO_MANY_REQUESTS:
      return ApiErrorCode.RATE_LIMITED;
    case HttpStatus.BAD_REQUEST:
      return ApiErrorCode.VALIDATION_ERROR;
    default:
      return ApiErrorCode.INTERNAL_ERROR;
  }
}
