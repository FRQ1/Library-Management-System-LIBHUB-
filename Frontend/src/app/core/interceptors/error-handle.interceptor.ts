import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Centralizes HttpErrorResponse unwrapping so components/services don't each
 * need to reach into `err.message` themselves. Re-throws a plain Error
 * whose `.message` is the backend's message when available (undefined
 * otherwise), so callers keep using their own specific fallback text via
 * `err.message || 'Something specific went wrong.'`.
 */
export const errorHandleInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const backendMessage =
        error.error instanceof ErrorEvent ? undefined : error.error?.message;

      return throwError(() => Object.assign(new Error(backendMessage), { status: error.status }));
    }),
  );
};
