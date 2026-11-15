import { createDataLoader } from "./loader";

export { DataLoadError } from "./loader";

/** Real data from public/data/ by default. Set VITE_MOCK=true to use the SYNTHETIC fixtures/. */
export const MOCK = import.meta.env.VITE_MOCK === "true";

/** The app's one way to read contract JSON (contracts/README.md). */
export const loadData = createDataLoader({
  mock: MOCK,
  baseUrl: import.meta.env.BASE_URL,
  fetch: (...args) => fetch(...args),
}).load;
