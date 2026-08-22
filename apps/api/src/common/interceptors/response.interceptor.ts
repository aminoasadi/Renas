import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";
import type { ApiSuccess } from "@renas/shared";

/**
 * Wraps every successful controller return value in the `{ data, meta }`
 * envelope. Controllers just return plain values — this is the one place
 * that shape is enforced, so it can never drift between modules.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccess<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccess<T>> {
    return next.handle().pipe(
      map((result) => {
        if (result && typeof result === "object" && "data" in (result as object)) {
          return result as unknown as ApiSuccess<T>;
        }
        return { data: result };
      }),
    );
  }
}
