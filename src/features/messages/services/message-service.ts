/**
 * Message service — no-op.
 * Message events are now handled by guild polling service (guild-service.ts).
 * This file kept for backward compatibility with any imports.
 */
export function initMessageHandlers(): () => void {
  return () => {};
}
