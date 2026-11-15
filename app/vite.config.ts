import { cpSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

const repoRoot = resolve(__dirname, "..");

/**
 * Serves one folder of contract JSON at `<base>data/`:
 *   mock mode (default)  -> fixtures/     (SYNTHETIC sample files)
 *   VITE_MOCK=false      -> public/data/  (real pipeline output)
 * In dev it is served from disk; on build it is copied to dist/data/.
 */
function dataDir(dir: string, base: string, mock: boolean): Plugin {
  const keepDirOrJson = (p: string) =>
    statSync(p).isDirectory() ? basename(p) !== "__pycache__" : extname(p) === ".json";
  return {
    name: "data-dir",
    configureServer(server) {
      server.middlewares.use(`${base}data`, (req, res, next) => {
        const file = join(dir, decodeURIComponent((req.url ?? "/").split("?")[0]));
        if (relative(dir, file).startsWith("..") || !existsSync(file) || statSync(file).isDirectory()) {
          return next();
        }
        res.setHeader("Content-Type", "application/json");
        res.end(readFileSync(file));
      });
    },
    writeBundle(options) {
      if (!existsSync(dir)) {
        throw new Error(`Data folder not found: ${dir}. Run the pipeline first, or build with VITE_MOCK=true.`);
      }
      if (!mock) {
        // contracts/README.md rule 3: a real build fails if any data file says "synthetic": true.
        const synthetic = readdirSync(dir, { recursive: true, encoding: "utf8" })
          .filter((f) => extname(f) === ".json")
          .filter((f) => JSON.parse(readFileSync(join(dir, f), "utf8")).synthetic === true);
        if (synthetic.length > 0) {
          throw new Error(`Real build (VITE_MOCK=false) found SYNTHETIC files in ${dir}: ${synthetic.join(", ")}`);
        }
      }
      cpSync(dir, join(options.dir!, "data"), { recursive: true, filter: keepDirOrJson });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "VITE_");
  const mock = env.VITE_MOCK !== "false";
  const base = env.VITE_BASE || "/";
  return {
    base,
    // satellite.js re-exports an optional WASM build whose worker uses top-level await. We only use
    // its plain JS functions, so the worker is never loaded, but it must still be bundled as ES.
    worker: { format: "es" as const },
    plugins: [react(), tailwindcss(), dataDir(mock ? join(repoRoot, "fixtures") : join(repoRoot, "public", "data"), base, mock)],
  };
});
