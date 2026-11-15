# Story skin (`app/src/story/skin/`)

Reusable look for /story. Import from `./skin`, load `./skin/skin.css` once. Preview: `npm run dev`, open `/story-skin.html` (add `?lite=1` for lite mode).
Own files only: `skin/**`, `assets/art/**`, `app/story-skin.html`, this file. All CSS variables are prefixed `--sk-` so nothing collides with `styles.css`.

**Rules baked in**
- Orange-red = fire only. Teal = MODIS (circle). Indigo = VIIRS (triangle). Overlap = white = harmonization. Never colour alone.
- Orbs are objects, not a page wash. Max **2 blurred layers per scene** (each `GradientOrb` is exactly 1). The preview page shows many orbs only because it is a gallery.
- `prefers-reduced-motion` gives the static final state. `?lite=1` removes blur and animation. Both via `useSkinMode()`.
- Headline <= 8 words + one line <= 14 words per scene; captions are short labels (long text drops uppercase automatically).

**Fonts** (Google Fonts, loaded by `tokens.css` @import). Ө ө Ү ү verified present in each file's cmap (fontTools):
| Role | Family | Result |
|---|---|---|
| Display (condensed bold) | Oswald 500/700 | pass |
| Mono (tracked captions) | JetBrains Mono 400/500 | pass |
| Body | Inter 400-600 | pass |
Also tested and passing (alternates): Fira Sans Extra Condensed, Roboto Condensed, IBM Plex Mono, Roboto Mono, PT Mono, Manrope, Onest, Golos Text. Not tested for lack of a readable file: Bebas Neue, Anton, Archivo Narrow, Spline Sans Mono. Rendering was also checked visually (Өнөөдөр, Үнэн in the preview). Needs network for the fonts; fallbacks are system condensed / mono / sans.

## Tokens
`tokens.css` (CSS vars) and `tokens.ts` (`palette, fonts, space, dur, ease, z, sensorColor`).
`design/tokens.json` does not exist in this repo yet. When it lands it wins: update the values in these two files to match. Note the existing app tokens differ (`--accent #f2994a`, sensor colours amber `#f5a742` / sky `#58b8f5` in `globe/platforms.ts`); the skin uses teal/indigo per the art direction. **Flag for the chapter chat: pick one pair before mixing skin components with the home globe chart.**

## Motion (`motion.ts`)
- `useSkinMode(): { reduced, lite, still }`
- `useReveal({ delay?, threshold?, once?, rise? })` -> `{ ref, shown, props }`
  ```tsx
  const r = useReveal({ delay: 120 });
  <h2 ref={r.ref} {...r.props}>Headline</h2>
  ```
- `useParallax(strengthPx = 8)` -> ref. Writes `--sk-px/--sk-py/--sk-sy`; add class `sk-parallax` to the element.
  ```tsx
  const ref = useParallax<HTMLDivElement>(10);
  <div ref={ref} className="sk-parallax"><GradientOrb /></div>
  ```
- `easing.expoOut | spring | inOut` (JS fns) and `ease.*` (CSS strings).

## Components
**GradientOrb** `{ from, to, mid, size, drift 0..1, intensity 0..1, blur px, spark, className, style }`. Absolutely positioned; wrap it in a sized, positioned box.
```tsx
<div style={{ position: "relative", height: 420 }}>
  <GradientOrb from="#ff5a1f" mid="#d62b8f" to="#1f3fbf" size="min(70vw,520px)" spark />
</div>
```
**SparkFlare** `{ size, color, angle, twinkle }` -> `<SparkFlare size={64} />`

**GrainOverlay** `{ opacity = 0.14, position = "absolute" | "fixed" }` -> `<GrainOverlay opacity={0.12} />` (put it last in a positioned scene).

**Stars / SkinStage** `Stars { count, seed }`; `SkinStage { tone: "ink" | "cobalt" }` wraps stars + children + grain.
```tsx
<SkinStage tone="ink">{scene}</SkinStage>
```
**TrackedCaption** `{ children: string, as, size: "micro"|"caption", tone: "cream"|"dim"|"pink"|"lime", wide }`
```tsx
<TrackedCaption tone="dim" wide>Chapter 07</TrackedCaption>
<TrackedCaption tone="pink">[ verify ]</TrackedCaption>
```
**GlyphTile** `{ children, size = 28, tone, label? }` -> `<GlyphTile tone="modis">●</GlyphTile>` (aria-hidden unless `label`).

**HairlineFrame** `{ corners, diagonals [[x1,y1,x2,y2]% ...], grid px, coords [tl,tr,bl,br], barcode, inset }`. aria-hidden, put inside a `position: relative` box.
```tsx
<HairlineFrame grid={72} diagonals={[[0,100,100,0]]} coords={["47.92°N","106.92°E"]} barcode="seed" />
```
**SpectrumTimeline** `{ events, range = [1999, 2030], orientation, length, summary }`; event `{ id, label, sensor: "MODIS"|"VIIRS", kind: "launch"|"retire", year?, verified? }`.
A year is placed and printed **only if `verified: true`**. Anything else prints a pink `[ verify ]` and is spaced evenly by order (not to scale). Use `orientation="vertical"` on phones (horizontal labels collide below ~600px).
```tsx
<SpectrumTimeline summary="Launch order" events={[{ id: "terra", label: "Terra", sensor: "MODIS", kind: "launch" }]} />
```
**CartoonSatellite** `{ id: "terra"|"aqua"|"snpp"|"noaa20"|"noaa21", src?, size = 220, bubble?, inset?, label = true }`. Uses `assets/art/<id>.webp` when present, otherwise the built-in SVG. Always keep the "stylized illustration" label.
```tsx
<CartoonSatellite id="aqua" size={200} bubble="Afternoon shift." />
```
**TwoHands** `{ children?, left, right, width = 640 }`. Children render in the light-burst slot between the fingertips (default: a SparkFlare).
```tsx
<TwoHands width={560}><GradientOrb size={90} blur={8} /></TwoHands>
```

## Known limits
- Satellite art is the SVG fallback (Higgsfield was not used, see `AI_USAGE.md`). Dropping `terra.webp` etc. into `assets/art/` upgrades them with no code change.
- VIIRS indigo on the cobalt ground is low contrast; the triangle shape and text label carry the meaning.
