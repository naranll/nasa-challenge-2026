import { describe, expect, it } from "vitest";
import { createDataLoader } from "./loader";

/** A fake fetch that serves a fixed set of files by URL. Unknown URLs return 404. */
function fakeFetch(files: Record<string, unknown>): typeof fetch {
  return async (input) => {
    const url = String(input);
    if (!(url in files)) return new Response("not found", { status: 404 });
    return new Response(JSON.stringify(files[url]), { status: 200 });
  };
}

const regions = {
  schema_version: "0.1",
  synthetic: false,
  regions: [{ region_id: "mongolia", name_en: "Mongolia", name_mn: "Монгол", kind: "country" }],
};

describe("data loader", () => {
  it("returns the parsed contract file from <base>data/<path>", async () => {
    const loader = createDataLoader({
      mock: false,
      baseUrl: "/site/",
      fetch: fakeFetch({ "/site/data/regions.json": regions }),
    });

    await expect(loader.load("regions.json")).resolves.toEqual(regions);
  });

  it("throws, naming the file, when the file is missing (missing is not zero)", async () => {
    const loader = createDataLoader({ mock: false, baseUrl: "/", fetch: fakeFetch({}) });

    await expect(loader.load("calendar/dornod.json")).rejects.toThrow(/calendar\/dornod\.json.*404/);
  });

  it("refuses a synthetic (fixture) file in real mode, so fake data never reaches the demo", async () => {
    const fixture = { ...regions, synthetic: true };
    const loader = createDataLoader({
      mock: false,
      baseUrl: "/",
      fetch: fakeFetch({ "/data/regions.json": fixture }),
    });

    await expect(loader.load("regions.json")).rejects.toThrow(/regions\.json.*synthetic/);
  });

  it("accepts synthetic files in mock mode", async () => {
    const fixture = { ...regions, synthetic: true };
    const loader = createDataLoader({
      mock: true,
      baseUrl: "/",
      fetch: fakeFetch({ "/data/regions.json": fixture }),
    });

    await expect(loader.load("regions.json")).resolves.toEqual(fixture);
  });

  it("refuses a file without schema_version (not a contract file)", async () => {
    const loader = createDataLoader({
      mock: true,
      baseUrl: "/",
      fetch: fakeFetch({ "/data/regions.json": { regions: [] } }),
    });

    await expect(loader.load("regions.json")).rejects.toThrow(/regions\.json.*schema_version/);
  });
});
