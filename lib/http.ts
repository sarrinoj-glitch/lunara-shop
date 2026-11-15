import 'server-only'
import { AppError, E, HTTP_STATUS, type ErrorCode } from '@/lib/errors'
import { logger } from '@/lib/logger'

export function respond<T>(data: T, status = 200) {
  return Response.json({ data }, { status })
}

export function errorResponse(code: ErrorCode, message: string, traceId?: string, details?: unknown) {
  return Response.json({ error: { code, message, traceId, details } }, { status: HTTP_STATUS[code] })
}

errorResponse.fromException = (e: unknown, traceId: string) => {
  if (e instanceof AppError) return errorResponse(e.code, e.message, traceId, e.details)
  logger.error({ traceId, code: E.DATASOURCE_DOWN, err: e }, 'unhandled')
  return errorResponse(E.DATASOURCE_DOWN, 'Сервис временно недоступен', traceId)
}
