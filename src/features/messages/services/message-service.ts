/**
 * Message service — no-op stub.
 * Message events handled centrally in guild-service.ts via gateway.
 */
export function initMessageHandlers(): () => void {
  return () => {};
}
