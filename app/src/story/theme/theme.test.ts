import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import tokens from "./tokens.json";
import { slotForFile } from "./fonts";

const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8").toLowerCase();

function leaves(o: unknown): string[] {
  if (typeof o === "string") return /^#[0-9a-f]{6}$/i.test(o) ? [o.toLowerCase()] : [];
  if (o && typeof o === "object") return Object.values(o).flatMap(leaves);
  return [];
}

describe("theme tokens", () => {
  it("tokens.css contains every colour in tokens.json, so the two cannot drift", () => {
    for (const hex of leaves(tokens)) expect(css, hex).toContain(hex);
  });
});

describe("font slots", () => {
  it("maps file names to families, styles and weights", () => {
    expect(slotForFile("../assets/fonts/display.woff2")).toEqual({ family: "Story Display", style: "normal", weight: "400" });
    expect(slotForFile("x/display-italic.woff2")).toEqual({ family: "Story Display", style: "italic", weight: "400" });
    expect(slotForFile("x/display-300.woff2")).toEqual({ family: "Story Display", style: "normal", weight: "300" });
    expect(slotForFile("x/mono.woff2")?.family).toBe("Story Mono");
  });

  it("ignores files it does not know", () => {
    expect(slotForFile("x/random.woff2")).toBeNull();
    expect(slotForFile("x/display.ttf")).toBeNull();
  });
});
