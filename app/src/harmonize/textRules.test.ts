/** #14: every number comes from a data file, and all UI text comes from i18n in both languages. */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import en from "../i18n/en.json";
import mn from "../i18n/mn.json";

const src = join(__dirname, "..");
const files = [
  ...["harmonize", "calendar", "method"].flatMap((d) =>
    readdirSync(join(src, d))
      .filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes(".test."))
      .map((f) => join(d, f)),
  ),
  join("pages", "Dashboard.tsx"),
  join("pages", "Harmonizing.tsx"),
].map((f) => ({ f, text: readFileSync(join(src, f), "utf8") }));
const components = files.filter(({ f }) => f.endsWith(".tsx"));
const withoutComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");

describe("harmonizing text", () => {
  it("every key the new code names exists in en and mn", () => {
    const used = files.flatMap(({ text }) => [...text.matchAll(/["`]((?:cal|harm|method|dash)\.[\w.]+)["`]/g)].map((m) => m[1]));
    expect(used.length).toBeGreaterThan(40);
    for (const k of used) {
      expect(en, k).toHaveProperty([k]);
      expect(mn, k).toHaveProperty([k]);
    }
  });

  it("components have no text written straight into JSX or into aria-label/title", () => {
    for (const { f, text } of components) {
      const jsxText = [...withoutComments(text).matchAll(/(?<=[\w"'}])>\s*([^<>{}\n]*[A-Za-zА-Яа-яӨөҮү][^<>{}\n]*)\s*</g)]
        .map((m) => m[1].trim())
        .filter((s) => !/^[\w.]+\s*[=(]/.test(s) && !s.includes("=>") && !/^[)?:&|]/.test(s)); // code, not text
      expect(jsxText, f).toEqual([]);
      expect(text.match(/\b(aria-label|alt|title)="[^"]+"/g), f).toBeNull();
    }
  });

  it("code has no hand-typed years or dates (they come from the data files)", () => {
    for (const { f, text } of files) expect(withoutComments(text).match(/\b(19|20)\d\d(-\d\d){0,2}\b/g), f).toBeNull();
  });
});
