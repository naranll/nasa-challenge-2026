import { createDataLoader } from "./loader";

export { DataLoadError } from "./loader";

/** true while we build with fixtures (SYNTHETIC). Set VITE_MOCK=false to use public/data/. */
export const MOCK = import.meta.env.VITE_MOCK !== "false";

/** The app's one way to read contract JSON (contracts/README.md). */
export const loadData = createDataLoader({
  mock: MOCK,
  baseUrl: import.meta.env.BASE_URL,
  fetch: (...args) => fetch(...args),
}).load;
