/**
 * Relationship gateway handler registration.
 * Invalidates React Query cache on relationship add/remove.
 */
import { gateway } from "@/gateway/client";
import type { QueryClient } from "@tanstack/react-query";

export function initRelationshipHandlers(queryClient: QueryClient): () => void {
  const unsubs: (() => void)[] = [];

  unsubs.push(
    gateway.on("RELATIONSHIP_ADD", () => {
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
    })
  );

  unsubs.push(
    gateway.on("RELATIONSHIP_REMOVE", () => {
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
    })
  );

  return () => unsubs.forEach((fn) => fn());
}
