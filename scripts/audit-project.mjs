import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const root = new URL("../", import.meta.url);
const failures = [];
const requiredFiles = [
  "LICENSE",
  "README.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "index.html",
  "public/.nojekyll",
  "public/favicon.svg",
  ".github/workflows/deploy-pages.yml",
  "src/main.tsx",
  "src/router.tsx",
];
const requiredRoutes = [
  "index.tsx",
  "portfolio.tsx",
  "opportunities.tsx",
  "actions.tsx",
  "electrical.tsx",
  "analytics.tsx",
  "demand.tsx",
  "alarms.tsx",
  "assets.tsx",
  "billing.tsx",
  "reports.tsx",
  "sustainability.tsx",
  "data-health.tsx",
];
const forbidden = [
  new RegExp(["love", "able"].join(""), "i"),
  /@tanstack\/react-start/i,
  new RegExp(`@${["love", "able"].join("")}\\.dev`, "i"),
  /\bnitro\b/i,
];

async function exists(path) {
  try {
    await stat(new URL(path, root));
    return true;
  } catch {
    return false;
  }
}

async function walk(path = ".") {
  const directory = new URL(`${path}/`, root);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if ([".git", "node_modules", "dist"].includes(entry.name)) continue;
    const child = join(path, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(child)));
    else files.push(child);
  }
  return files;
}

for (const file of requiredFiles) {
  if (!(await exists(file))) failures.push(`Missing required file: ${file}`);
}
for (const route of requiredRoutes) {
  if (!(await exists(`src/routes/${route}`))) failures.push(`Missing product route: src/routes/${route}`);
}

const pkg = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
if (pkg.license !== "GPL-3.0-only") failures.push("package.json license must be GPL-3.0-only");
if (pkg.private !== false) failures.push("package.json must explicitly set private=false");

for (const file of await walk()) {
  if (file === "scripts/audit-project.mjs" || file === "AUDIT.md") continue;
  if (/\.(ico|png|jpg|jpeg|gif|zip|woff2?)$/i.test(file)) continue;
  const content = await readFile(new URL(file, root), "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(content)) failures.push(`Forbidden legacy reference ${pattern} in ${relative(".", file)}`);
  }
}

if (failures.length) {
  console.error("ArGrid project audit failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("ArGrid project audit passed.");
console.log(`Validated ${requiredRoutes.length} product routes, GPL-3.0-only licensing, static deployment files, and zero legacy builder/SSR runtime references.`);
