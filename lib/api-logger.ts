/**
 * Response logging for API routes. Use for visibility in logs.
 * Prefix: [API] so logs can be grepped.
 */

const MAX_PAYLOAD_LOG_LENGTH = 500

function sanitize(payload: unknown): unknown {
  if (payload === null || typeof payload !== 'object') return payload
  if (Array.isArray(payload)) {
    if (payload.length > 10) return { __array: true, length: payload.length, sample: payload.slice(0, 2) }
    return payload.map(sanitize)
  }
  const obj = payload as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'password' || k === 'token') out[k] = '[REDACTED]'
    else out[k] = sanitize(v)
  }
  return out
}

function stringify(payload: unknown): string {
  try {
    const s = JSON.stringify(sanitize(payload))
    return s.length > MAX_PAYLOAD_LOG_LENGTH ? s.slice(0, MAX_PAYLOAD_LOG_LENGTH) + '...' : s
  } catch {
    return String(payload)
  }
}

/**
 * Log an API response before returning. Call right before NextResponse.json(...) or return.
 */
export function logResponse(method: string, path: string, status: number, body: unknown): void {
  console.log(`[API] ${method} ${path} ${status}`, stringify(body))
}
