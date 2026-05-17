import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { correlationId?: string }>();
    const { method, url, correlationId } = req;
    const startTime = Date.now();

    this.logger.log({
      message: 'Incoming request',
      method,
      url,
      correlationId,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          this.logger.log({
            message: 'Request completed',
            method,
            url,
            statusCode: res.statusCode,
            duration: `${Date.now() - startTime}ms`,
            correlationId,
          });
        },
        error: (err: unknown) => {
          this.logger.error({
            message: 'Request failed',
            method,
            url,
            error: err instanceof Error ? err.message : String(err),
            duration: `${Date.now() - startTime}ms`,
            correlationId,
          });
        },
      }),
    );
  }
}
