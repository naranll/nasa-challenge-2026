import { describe, expect, it } from "vitest";
import { buildLonLatIndex, continentView, cssToRgb } from "./globeData";

describe("cssToRgb", () => {
  it("reads hex and rgb() colours as 0..1", () => {
    expect(cssToRgb("#ff0080")).toEqual([1, 0, 128 / 255]);
    expect(cssToRgb("rgb(255, 0, 51)")).toEqual([1, 0, 0.2]);
  });
});

describe("buildLonLatIndex", () => {
  const lons = Float32Array.from([10, 10.3, 179.9, -50]);
  const lats = Float32Array.from([20, 20, 0, 60]);
  const index = buildLonLatIndex(lons, lats);

  it("finds the nearest item inside the radius, and nothing outside it", () => {
    expect(index.nearest(10.25, 20, 0.5)).toBe(1);
    expect(index.nearest(10.05, 20, 0.5)).toBe(0);
    expect(index.nearest(12, 20, 0.5)).toBe(-1);
  });

  it("wraps across ±180°", () => {
    expect(index.nearest(-179.95, 0, 0.5)).toBe(2);
  });

  it("shrinks longitude by cos(latitude): 1° of longitude at 60° is about 0.5° of distance", () => {
    expect(index.nearest(-49.2, 60, 0.5)).toBe(3);
    expect(index.nearest(-49.2, 60, 0.3)).toBe(-1);
  });
});

describe("continentView", () => {
  it("looks at the bbox centre, also for a bbox crossing 180°", () => {
    const v = continentView([170, -50, 190, -30]);
    expect(v.lat).toBe(-40);
    expect(v.lon).toBe(-180);
  });

  it("stays between the near and far limits", () => {
    expect(continentView([0, 0, 1, 1]).distance).toBe(1.8);
    expect(continentView([-180, -90, 180, 90]).distance).toBe(4);
  });
});
