/**
 * The merge half of composition: JSON files that several fragments contribute to,
 * and the .env / README files that are line- and section-oriented.
 */

const crypto = require("crypto");
const fs = require("fs");

/** Fragments write "@secret" when they need a real generated value. */
const SECRET = "@secret";
const secret = () => crypto.randomBytes(32).toString("hex");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJson = (file, data) => fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);

const sortKeys = (obj) =>
  Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));

/**
 * Merge a fragment manifest's contributions into package.json.
 * Dependency keys are sorted so the file is stable no matter the fragment order.
 */
function mergePackageJson(file, contrib) {
  const pkg = readJson(file);

  for (const field of ["dependencies", "devDependencies"]) {
    if (!contrib[field]) continue;
    pkg[field] = sortKeys({ ...(pkg[field] || {}), ...contrib[field] });
  }
  if (contrib.scripts) pkg.scripts = { ...pkg.scripts, ...contrib.scripts };
  if (contrib.engines) pkg.engines = { ...pkg.engines, ...contrib.engines };
  if (contrib.packageJson) Object.assign(pkg, contrib.packageJson);
  for (const field of contrib.packageJsonDelete || []) delete pkg[field];

  writeJson(file, pkg);
}

/** Identity fields the generated project should own, rather than inherit from the CLI. */
function brandPackageJson(file, { name, description }) {
  const pkg = readJson(file);
  pkg.name = name;
  pkg.version = "0.1.0";
  pkg.description = description;
  delete pkg.bugs;
  delete pkg.homepage;
  writeJson(file, pkg);
}

function mergeTsConfig(file, contrib) {
  if (!fs.existsSync(file)) return;
  // tsconfig.json is JSON with comments in principle; ours are plain JSON.
  const cfg = readJson(file);
  if (contrib.compilerOptions) {
    cfg.compilerOptions = { ...(cfg.compilerOptions || {}), ...contrib.compilerOptions };
  }
  for (const field of ["include", "exclude"]) {
    if (contrib[field]) cfg[field] = [...new Set([...(cfg[field] || []), ...contrib[field]])];
  }
  writeJson(file, cfg);
}

/**
 * Append KEY=value lines to a .env file, skipping keys that are already set.
 * "@secret" is replaced with a freshly generated value, so nothing ships a
 * placeholder that would work identically on every install.
 */
function mergeEnv(file, vars) {
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const present = new Set(
    existing.split("\n").map((l) => l.split("=")[0].trim()).filter(Boolean)
  );

  const added = Object.entries(vars)
    .filter(([k]) => !present.has(k))
    .map(([k, v]) => `${k}=${v === SECRET ? secret() : v}`);

  if (!added.length) return;
  const body = existing.length && !existing.endsWith("\n") ? `${existing}\n` : existing;
  fs.writeFileSync(file, `${body}${added.join("\n")}\n`);
}

/** Append patterns a fragment's own artifacts need ignored (a SQLite file, a build dir). */
function mergeGitignore(file, patterns) {
  if (!patterns.length) return;
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const present = new Set(existing.split("\n").map((l) => l.trim()));
  const added = patterns.filter((p) => !present.has(p));
  if (!added.length) return;
  const body = existing.length && !existing.endsWith("\n") ? `${existing}\n` : existing;
  fs.writeFileSync(file, `${body}${added.join("\n")}\n`);
}

/** Each fragment's README.md becomes a section of the generated README. */
function appendReadmeSections(file, sections) {
  if (!sections.length) return;
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/\s*$/, "\n") : "";
  fs.writeFileSync(file, `${existing}\n## What's included\n\n${sections.join("\n\n")}\n`);
}

module.exports = {
  SECRET,
  readJson,
  writeJson,
  mergePackageJson,
  brandPackageJson,
  mergeTsConfig,
  mergeEnv,
  mergeGitignore,
  appendReadmeSections,
};
