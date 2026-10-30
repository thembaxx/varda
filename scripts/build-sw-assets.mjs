import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)],
  );
}
if (!existsSync(".next/static"))
  throw new Error("Build Next.js before creating the offline asset list.");
const files = walk(".next/static")
  .filter((path) => !path.endsWith(".map"))
  .map((path) => path.replace(".next/", "/_next/"));
writeFileSync("public/sw-assets.json", JSON.stringify(files));
const buildId = readFileSync(".next/BUILD_ID", "utf8").trim();
const worker = readFileSync("public/sw.js", "utf8")
  .replace(/const SHELL = '[^']+';/, `const SHELL = 'varda-shell-${buildId}';`)
  .replace(/const ASSETS = '[^']+';/, `const ASSETS = 'varda-assets-${buildId}';`);
writeFileSync("public/sw.js", worker);
if (existsSync(".next/standalone")) {
  const { cpSync } = await import("node:fs");
  mkdirSync(".next/standalone/public", { recursive: true });
  cpSync("public", ".next/standalone/public", { recursive: true });
  cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
}
console.log(`Offline asset manifest: ${files.length} versioned files.`);
