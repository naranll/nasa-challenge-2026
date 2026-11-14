/** Spec §6.4, §10, §13: all UI text comes from i18n, both languages have every key, no hand-typed data. */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import en from "../i18n/en.json";
import mn from "../i18n/mn.json";

const dir = __dirname;
const source = readdirSync(dir)
  .filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes(".test."))
  .map((f) => ({ f, text: readFileSync(join(dir, f), "utf8") }));
const components = source.filter(({ f }) => f.endsWith(".tsx"));
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("i18n files", () => {
  it("en and mn have the same keys, none empty", () => {
    expect(Object.keys(mn).sort()).toEqual(Object.keys(en).sort());
    for (const [k, v] of [...Object.entries(en), ...Object.entries(mn)]) expect(v.trim(), k).not.toBe("");
  });

  it("each key has the same {placeholders} in both languages", () => {
    for (const k of Object.keys(en) as (keyof typeof en)[]) expect(placeholders(mn[k]), k).toEqual(placeholders(en[k]));
  });

  it("every key the globe code names exists (literal t() keys and the per-platform templates)", () => {
    const used = source.flatMap(({ text }) => [...text.matchAll(/["`]((?:home|globe)\.[\w.]+)["`]/g)].map((m) => m[1]));
    expect(used.length).toBeGreaterThan(20);
    for (const k of used) expect(en, k).toHaveProperty([k]);
    for (const id of ["terra", "aqua", "snpp", "noaa20", "noaa21"]) {
      expect(en).toHaveProperty([`globe.platform.${id}.name`]);
      expect(en).toHaveProperty([`globe.status.${id}`]);
    }
  });
});

describe("globe components", () => {
  it("have no text written straight into JSX", () => {
    for (const { f, text } of components) {
      // >Some words< between tags, ignoring {expressions}. A tag's ">" follows a name, quote or "}",
      // never a space, which keeps comparisons like `a > 1 && b < 2` out.
      const jsxText = [...text.matchAll(/(?<=[\w"'}])>\s*([^<>{}\n]*[A-Za-zА-Яа-яӨөҮү][^<>{}\n]*)\s*</g)]
        .map((m) => m[1].trim())
        .filter((s) => !/^[\w.]+\s*[=(]/.test(s) && !s.includes("=>") && !s.startsWith("//"));
      expect(jsxText, f).toEqual([]);
    }
  });

  it("have no hard-coded text in aria-label, alt or title", () => {
    for (const { f, text } of components) expect(text.match(/\b(aria-label|alt|title)="[^"]+"/g), f).toBeNull();
  });
});

describe("no hand-typed data (#10: all numbers come from data files)", () => {
  it("globe code has no dates or years in it", () => {
    for (const { f, text } of source) {
      const code = text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ""); // comments may cite dates
      expect(code.match(/\b(19|20)\d\d(-\d\d){0,2}\b/g), f).toBeNull();
    }
  });
});
