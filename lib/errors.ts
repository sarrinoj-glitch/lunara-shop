export const E = {
  AUTH_REQUIRED: 'E_AUTH_REQUIRED',
  FORBIDDEN: 'E_FORBIDDEN',
  NOT_FOUND: 'E_NOT_FOUND',
  VALIDATION: 'E_VALIDATION',
  RATE_LIMIT: 'E_RATE_LIMIT',
  DATASOURCE_DOWN: 'E_DATASOURCE_DOWN',
  IDEMPOTENCY_CONFLICT: 'E_IDEMPOTENCY_CONFLICT',
  UNAVAILABLE_ITEMS: 'E_UNAVAILABLE_ITEMS',
} as const

export type ErrorCode = (typeof E)[keyof typeof E]

export const HTTP_STATUS: Record<ErrorCode, number> = {
  E_AUTH_REQUIRED: 401,
  E_FORBIDDEN: 403,
  E_NOT_FOUND: 404,
  E_VALIDATION: 422,
  E_RATE_LIMIT: 429,
  E_DATASOURCE_DOWN: 503,
  E_IDEMPOTENCY_CONFLICT: 409,
  E_UNAVAILABLE_ITEMS: 422,
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; traceId?: string; details?: unknown } }
