/** #34: World map-ийн бүх текст `world.*` i18n key-ээс, en болон mn хоёуланд нь. */
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

describe("world map text", () => {
  it("every world.* key the code names exists in en and mn, including the per-code templates", () => {
    const used = source.flatMap(({ text }) => [...text.matchAll(/["`](world\.[\w.]+)["`]/g)].map((m) => m[1]));
    expect(used.length).toBeGreaterThan(10);
    const templated = [
      ...["terra", "aqua", "snpp", "noaa20", "noaa21"].map((p) => `world.platform.${p}`),
      ...["VIIRS", "MODIS"].map((s) => `world.sensor.${s}`),
      ...["low", "nominal", "high"].map((c) => `world.conf.${c}`),
      ...["D", "N"].map((d) => `world.dn.${d}`),
      ...["both", "viirs_only", "modis_only", "not_comparable"].map((m) => `world.match.${m}`),
    ];
    for (const k of [...used, ...templated]) {
      expect(en, k).toHaveProperty([k]);
      expect(mn, k).toHaveProperty([k]);
    }
  });

  it("components have no text written straight into JSX or into aria-label / title", () => {
    for (const { f, text } of components) {
      const jsxText = [...text.matchAll(/(?<=[\w"'}])>\s*([^<>{}\n]*[A-Za-zА-Яа-яӨөҮү][^<>{}\n]*)\s*</g)]
        .map((m) => m[1].trim())
        // ") : a ? (" нь JSX доторх ternary, текст биш.
        .filter((s) => !/^[\w.]+\s*[=(]/.test(s) && !s.includes("=>") && !s.startsWith("//") && !s.startsWith(")"));
      expect(jsxText, f).toEqual([]);
      expect(text.match(/\b(aria-label|alt|title)="[^"]+"/g), f).toBeNull();
    }
  });

  it("code has no hand-typed years or dates (they come from the data files)", () => {
    for (const { f, text } of source) {
      const code = text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ""); // comment-д огноо дурдаж болно
      expect(code.match(/\b(19|20)\d\d(-\d\d){0,2}\b/g), f).toBeNull();
    }
  });
});
