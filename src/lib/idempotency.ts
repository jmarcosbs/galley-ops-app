const HEADER_NAME = 'Idempotency-Key';

export const generateIdempotencyKey = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const randomSuffix = Math.random().toString(36).slice(2);
  return `${Date.now().toString(36)}-${randomSuffix}`;
};

type HeaderRecord = Record<string, string>;

export const withIdempotencyKey = (
  headers: HeaderRecord = {},
  key?: string,
): HeaderRecord => ({
  ...headers,
  [HEADER_NAME]: key ?? generateIdempotencyKey(),
});

export const IDEMPOTENCY_HEADER = HEADER_NAME;
