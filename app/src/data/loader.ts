export interface DataLoaderOptions {
  mock: boolean;
  baseUrl: string;
  fetch: typeof fetch;
}

export class DataLoadError extends Error {
  constructor(
    readonly path: string,
    reason: string,
  ) {
    super(`Could not load data file "${path}": ${reason}`);
    this.name = "DataLoadError";
  }
}

export function createDataLoader({ mock, baseUrl, fetch }: DataLoaderOptions) {
  return {
    async load<T>(path: string): Promise<T> {
      const response = await fetch(`${baseUrl}data/${path}`);
      if (!response.ok) {
        throw new DataLoadError(path, `HTTP ${response.status}`);
      }
      const data = (await response.json()) as { schema_version?: unknown; synthetic?: unknown } | null;
      if (typeof data !== "object" || data === null || typeof data.schema_version !== "string") {
        throw new DataLoadError(path, "missing schema_version, so it is not a contract file");
      }
      if (!mock && data.synthetic === true) {
        throw new DataLoadError(path, 'file says "synthetic": true but the app is in real mode (MOCK=false)');
      }
      return data as T;
    },
  };
}
