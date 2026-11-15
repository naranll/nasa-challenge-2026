/** Any number shown on the story page goes through this, so it always carries a claim ID that exists. */
import type { ReactNode } from "react";
import claims from "../claims.json";

export const CLAIM_IDS: string[] = Object.keys(claims.claims);

export function Claimed({ id, children }: { id: string; children: ReactNode }) {
  if (!CLAIM_IDS.includes(id)) {
    if (import.meta.env.DEV) console.warn(`[story] unknown claim id "${id}"; number hidden`);
    return <span data-claim-missing={id}>—</span>;
  }
  return (
    <span data-claim={id} title={id}>
      {children}
    </span>
  );
}
