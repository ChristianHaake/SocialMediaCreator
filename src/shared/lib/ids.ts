export function createId(prefix: string) {
  const randomId = globalThis.crypto?.randomUUID?.();
  return randomId
    ? `${prefix}-${randomId}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
