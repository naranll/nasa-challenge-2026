/** Any number shown on the story page goes through this, so it always carries a claim ID that exists. */
import type { ReactNode } from "react";
import claims from "../claims.json";

export const CLAIM_IDS: string[] = Object.keys(claims.claims);

/** `as="tspan"` for numbers inside SVG text, where an HTML span would not render. */
export function Claimed({ id, children, as = "span" }: { id: string; children: ReactNode; as?: "span" | "tspan" }) {
  const Tag = as;
  if (!CLAIM_IDS.includes(id)) {
    if (import.meta.env.DEV) console.warn(`[story] unknown claim id "${id}"; number hidden`);
    return <Tag data-claim-missing={id}>—</Tag>;
  }
  return (
    <Tag data-claim={id}>
      {children}
    </Tag>
  );
}
