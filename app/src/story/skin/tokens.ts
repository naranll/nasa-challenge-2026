/** Mirror of tokens.css for code that needs raw values (canvas, SVG attributes, JS animation). */
export const palette = {
  ink: "#07080C",
  cobalt: "#1F3FBF",
  cream: "#F3E6C8",
  fire: "#FF5A1F", // fire only
  modis: "#19C3B1", // teal
  viirs: "#5B5BF0", // indigo
  harmony: "#FFFFFF", // teal + indigo overlap
  lime: "#D7FF3A", // accent only
  pink: "#FF4FA3", // accent / [verify] placeholders only
  magenta: "#D62B8F", // orb mid-stop only
} as const;

export const fonts = {
  display: '"Oswald", "Arial Narrow", Impact, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
  body: '"Inter", system-ui, sans-serif',
} as const;

export const space = { s1: 4, s2: 8, s3: 12, s4: 16, s5: 24, s6: 40, s7: 64, s8: 112 } as const;

/** Durations in ms. */
export const dur = { fast: 180, base: 520, slow: 1100, drift: 26000 } as const;

export const ease = {
  expo: "cubic-bezier(0.16, 1, 0.3, 1)",
  spring: "cubic-bezier(0.34, 1.32, 0.64, 1)",
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
} as const;

export const z = { stars: 0, orb: 1, art: 2, chrome: 3, text: 4, grain: 5, nav: 6 } as const;

export type Sensor = "MODIS" | "VIIRS";
export const sensorColor: Record<Sensor, string> = { MODIS: palette.modis, VIIRS: palette.viirs };
