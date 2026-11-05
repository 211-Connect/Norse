import { redactUrl } from '@/lib/redact';

const MAX_BODY_CHARS = 300;

type ResponseLike = {
  status: number;
  statusText?: string;
  url?: string;
  /** Parsed error body, set by the generated Norse API SDK client. */
  error?: unknown;
};

function isResponseLike(value: unknown): value is ResponseLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ResponseLike).status === 'number'
  );
}

/** A body for a log line: one line, at most `MAX_BODY_CHARS`. */
export function truncateBody(body: unknown): string | undefined {
  if (body === undefined || body === null || body === '') return undefined;
  const text = (
    typeof body === 'string' ? body : (JSON.stringify(body) ?? String(body))
  )
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > MAX_BODY_CHARS
    ? `${text.slice(0, MAX_BODY_CHARS)}…`
    : text;
}

/**
 * Log fields for a caught value. The generated Norse API SDK throws the
 * failed `Response` itself (with the parsed body on `.error`), which
 * `String()` turns into "[object Response]"; this keeps its status and body.
 */
export function describeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    // Node's fetch hides the reason (ECONNREFUSED, ENOTFOUND, …) in `cause`.
    const cause = error.cause as
      { code?: unknown; message?: unknown } | undefined;
    const errorCause = cause?.code ?? cause?.message;
    return {
      error: error.message,
      errorName: error.name,
      ...(errorCause ? { errorCause: String(errorCause) } : {}),
    };
  }

  if (isResponseLike(error)) {
    return {
      error: `HTTP ${error.status}${error.statusText ? ` ${error.statusText}` : ''}`,
      status: error.status,
      ...(error.url ? { url: redactUrl(error.url) } : {}),
      ...(truncateBody(error.error) ? { body: truncateBody(error.error) } : {}),
    };
  }

  return { error: String(error) };
}
