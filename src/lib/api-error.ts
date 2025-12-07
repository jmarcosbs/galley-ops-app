const PRIORITY_KEYS = ['detail', 'message', 'error', 'errors', 'non_field_errors'];

const extractFromValue = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const message = extractFromValue(entry);
      if (message) return message;
    }
    return null;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of PRIORITY_KEYS) {
      if (key in record) {
        const message = extractFromValue(record[key]);
        if (message) return message;
      }
    }

    for (const nestedValue of Object.values(record)) {
      const message = extractFromValue(nestedValue);
      if (message) return message;
    }
  }

  return null;
};

export const extractApiErrorMessage = (payload: unknown): string | null => {
  return extractFromValue(payload);
};
