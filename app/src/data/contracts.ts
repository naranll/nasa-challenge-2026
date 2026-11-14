/** TypeScript shapes for contracts/README.md. Add fields as owners add them (additive-only). */

export interface Region {
  region_id: string;
  name_en: string;
  name_mn: string;
  kind: "country" | "aimag" | "capital";
}

export interface RegionsFile {
  schema_version: string;
  synthetic: boolean;
  regions: Region[];
}
