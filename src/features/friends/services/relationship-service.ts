/**
 * Relationship service — no-op stub.
 * Relationship events handled centrally in guild-service.ts via gateway.
 */
export function initRelationshipHandlers(): () => void {
  return () => {};
}
