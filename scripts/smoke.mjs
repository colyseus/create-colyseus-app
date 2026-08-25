#!/usr/bin/env node
/**
 * Generates the option matrix non-interactively and checks that what comes out
 * actually builds and passes its own tests.
 *
 *   node scripts/smoke.mjs            # generate, install, typecheck, test
 *   node scripts/smoke.mjs --quick    # generate + static checks only
 *   node scripts/smoke.mjs --filter turn-based
 *
 * Cases are derived from lib/options.js, so a new axis is covered by adding it
 * there — nothing to update here.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "index.js");

const { AXES, choicesFor } = require(path.join(ROOT, "lib", "options.js"));
const { loadPreset } = require(path.join(ROOT, "lib", "fragments.js"));

const args = process.argv.slice(2);
const QUICK = args.includes("--quick");
const filterIndex = args.indexOf("--filter");
const FILTER = filterIndex === -1 ? null : args[filterIndex + 1];

/**
 * Cases that fail for reasons outside this repository. Reported separately so
 * they stay visible without turning CI permanently red.
 */
const KNOWN_ISSUES = [];

const languages = choicesFor(AXES.find((a) => a.id === "language"), null).map((c) => c.value);
const axis = (id) => AXES.find((a) => a.id === id);

/** The matrix: every preset per language, then every single-axis variation. */
function buildCases() {
  const cases = [];

  for (const language of languages) {
    if (language === "haxe") {
      cases.push({ name: "haxe", flags: ["--haxe"] });
      continue;
    }

    for (const preset of choicesFor(axis("preset"), language)) {
      if (preset.value === "custom") continue;
      cases.push({ name: `${language}/preset:${preset.value}`, flags: [`--${language === "typescript" ? "typescript" : language}`, "--preset", preset.value] });
    }

    for (const id of ["layout", "netcode", "auth", "database"]) {
      for (const choice of choicesFor(axis(id), language)) {
        if (choice.value === axis(id).default) continue;
        cases.push({
          name: `${language}/${id}:${choice.value}`,
          flags: [`--${language === "typescript" ? "typescript" : language}`, axis(id).flag, choice.value],
        });
      }
    }

    // Everything the matchmaking axis offers, at once.
    const mm = choicesFor(axis("matchmaking"), language).map((c) => c.value);
    cases.push({
      name: `${language}/matchmaking:all`,
      flags: [`--${language === "typescript" ? "typescript" : language}`, "--matchmaking", mm.join(",")],
    });

    // Multi-axis combinations: fragment interactions (splice order, appRoot
    // placement under a shape) only surface when several fragments apply at once.
    if (language === "typescript") {
      cases.push({
        name: "typescript/combo:monorepo",
        flags: ["--typescript", "--layout", "monorepo", "--netcode", "tick", "--matchmaking", "lobby,reconnection", "--auth", "module", "--database", "colyseus"],
      });
      cases.push({
        name: "typescript/combo:vite",
        flags: ["--typescript", "--layout", "vite", "--netcode", "fixed", "--matchmaking", mm.join(","), "--auth", "oauth", "--database", "colyseus"],
      });
    } else {
      cases.push({
        name: `${language}/combo:server`,
        flags: [`--${language}`, "--netcode", "tick", "--matchmaking", mm.join(","), "--auth", "module"],
      });
    }
  }

  return FILTER ? cases.filter((c) => c.name.includes(FILTER)) : cases;
}

const results = [];
const record = (name, step, ok, detail) => results.push({ name, step, ok, detail });

const WINDOWS = process.platform === "win32";

function run(cmd, cmdArgs, cwd) {
  // Everything but node ships as a .cmd shim on Windows, which spawnSync only
  // finds by its full name.
  return spawnSync(WINDOWS && cmd !== "node" ? `${cmd}.cmd` : cmd, cmdArgs, {
    cwd,
    encoding: "utf8",
    // stdin closed on purpose: a prompt would block instead of silently passing.
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, CI: "1" },
  });
}

// ---------------------------------------------------------------- CLI contract

function checkCliContract(tmp) {
  const list = run("node", [CLI, "--list"], ROOT);
  let parsed = null;
  try { parsed = JSON.parse(list.stdout); } catch { /* reported below */ }
  const listedIds = parsed ? parsed.axes.map((a) => a.id) : [];
  const missing = AXES.map((a) => a.id).filter((id) => !listedIds.includes(id));
  record("cli", "--list covers every axis", missing.length === 0, missing.join(", "));

  const help = run("node", [CLI, "--help"], ROOT);
  record("cli", "--help exits 0", help.status === 0, help.stderr);

  const bad = run("node", [CLI, path.join(tmp, "bad"), "--netcode", "nope", "--yes", "--no-install"], ROOT);
  record("cli", "invalid value exits non-zero", bad.status !== 0, `status=${bad.status}`);
  record("cli", "invalid value lists valid ones", /Valid values for --netcode/.test(bad.stderr), bad.stderr.trim());

  const gated = run("node", [CLI, path.join(tmp, "gated"), "--cjs", "--netcode", "fixed", "--yes", "--no-install"], ROOT);
  record("cli", "language-gated value is rejected", gated.status !== 0, gated.stderr.trim());

  const legacy = run("node", [CLI, path.join(tmp, "legacy"), "--esm", "--yes", "--no-install"], ROOT);
  record("cli", "legacy --esm flag still works", legacy.status === 0, legacy.stderr);

  // No --yes, no TTY: must fall through to defaults rather than block.
  const piped = run("node", [CLI, path.join(tmp, "piped"), "--typescript", "--no-install"], ROOT);
  record("cli", "no TTY and no --yes uses defaults", piped.status === 0, piped.stderr);
}

// ------------------------------------------------------------ per-case checks

/** What the anchor splicer reads, and the wider set `{{var}}` substitution reaches. */
const SPLICED = /\.(ts|tsx|js|jsx|mjs|cjs|html|md|hx|hxml)$/;
const SUBSTITUTED = /\.(ts|tsx|js|jsx|mjs|cjs|html|md|hx|hxml|json|ya?ml)$/;

function checkGenerated(testCase, dir) {
  const files = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (entry.name === "node_modules") continue;
      const full = path.join(d, entry.name);
      entry.isDirectory() ? walk(full) : files.push(full);
    }
  };
  walk(dir);

  const leftovers = files.filter((f) => {
    if (!SPLICED.test(f)) return false;
    return fs.readFileSync(f, "utf8").includes("@colyseus:");
  });
  record(testCase.name, "no anchor residue", leftovers.length === 0, leftovers.map((f) => path.relative(dir, f)).join(", "));

  const unsubstituted = files.filter((f) => {
    if (!SUBSTITUTED.test(f)) return false;
    return /\{\{[\w-]+\}\}/.test(fs.readFileSync(f, "utf8"));
  });
  record(testCase.name, "no {{var}} residue", unsubstituted.length === 0, unsubstituted.map((f) => path.relative(dir, f)).join(", "));

  // A backslash is path.relative() leaking a Windows separator through a
  // substituted value — no template carries one of its own.
  const backslashed = files.filter((f) => {
    if (!SUBSTITUTED.test(f)) return false;
    return fs.readFileSync(f, "utf8").includes("\\");
  });
  record(testCase.name, "no Windows path separators", backslashed.length === 0, backslashed.map((f) => path.relative(dir, f)).join(", "));

  // Under a workspace shape, fragment files belong to the app package, not the root.
  if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
    const strays = ["src", "test"].filter((d) => fs.existsSync(path.join(dir, d)));
    record(testCase.name, "no fragment files at the workspace root", strays.length === 0, strays.join(", "));
  }

  const pkgFile = path.join(dir, "package.json");
  let pkg = null;
  try { pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8")); } catch (e) { /* reported below */ }
  record(testCase.name, "package.json parses", Boolean(pkg), pkgFile);
  if (!pkg) return;

  record(testCase.name, "package name matches folder", pkg.name === path.basename(dir), `${pkg.name} !== ${path.basename(dir)}`);

  const dupes = Object.keys(pkg.dependencies || {}).filter((d) => (pkg.devDependencies || {})[d]);
  record(testCase.name, "no dep in both dependencies and devDependencies", dupes.length === 0, dupes.join(", "));

  record(testCase.name, "_gitignore was renamed", !fs.existsSync(path.join(dir, "_gitignore")));
}

// ------------------------------------------------------------------- the run

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cca-smoke-"));
console.log(`workspace: ${tmp}\n`);

checkCliContract(tmp);

const cases = buildCases();
console.log(`${cases.length} cases\n`);

for (const testCase of cases) {
  const dir = path.join(tmp, testCase.name.replace(/[/:]/g, "-"));
  const generated = run("node", [CLI, dir, ...testCase.flags, "--yes", "--no-install"], ROOT);
  record(testCase.name, "generate", generated.status === 0, (generated.stderr || generated.stdout).trim().slice(0, 400));
  if (generated.status !== 0) continue;

  testCase.dir = dir;
  checkGenerated(testCase, dir);
}

// Group by dependency signature so each distinct dep set is installed once.
if (!QUICK) {
  const groups = new Map();
  for (const testCase of cases.filter((c) => c.dir)) {
    const pkg = JSON.parse(fs.readFileSync(path.join(testCase.dir, "package.json"), "utf8"));
    // A workspace install self-links its packages by name and hoists their
    // deps, so it is only valid for the project that produced it.
    const signature = pkg.workspaces
      ? testCase.name
      : JSON.stringify([pkg.dependencies, pkg.devDependencies]);
    if (!groups.has(signature)) groups.set(signature, []);
    groups.get(signature).push(testCase);
  }

  console.log(`${groups.size} distinct dependency sets to install\n`);

  for (const [, group] of groups) {
    const [leader, ...rest] = group;
    process.stdout.write(`  installing for ${leader.name} … `);
    const install = run("npm", ["install", "--no-audit", "--no-fund"], leader.dir);
    console.log(install.status === 0 ? "ok" : "FAILED");
    record(leader.name, "install", install.status === 0, install.stderr.trim().slice(0, 400));
    if (install.status !== 0) continue;

    for (const testCase of rest) {
      // A junction on Windows: creating a real symlink needs an elevated process.
      fs.symlinkSync(path.join(leader.dir, "node_modules"), path.join(testCase.dir, "node_modules"), WINDOWS ? "junction" : "dir");
    }

    for (const testCase of group) {
      const pkg = JSON.parse(fs.readFileSync(path.join(testCase.dir, "package.json"), "utf8"));

      if (fs.existsSync(path.join(testCase.dir, "tsconfig.json"))) {
        const tsc = run("npx", ["tsc", "--noEmit"], testCase.dir);
        record(testCase.name, "tsc --noEmit", tsc.status === 0, (tsc.stdout || tsc.stderr).trim().slice(0, 800));
      } else if (pkg.scripts && pkg.scripts.typecheck) {
        // Workspace layouts typecheck per package rather than from the root.
        const tsc = run("npm", ["run", "typecheck"], testCase.dir);
        record(testCase.name, "typecheck", tsc.status === 0, (tsc.stdout || tsc.stderr).trim().slice(0, 800));
      }

      if (pkg.scripts && pkg.scripts.test) {
        const test = run("npm", ["test"], testCase.dir);
        record(testCase.name, "test", test.status === 0, (test.stdout || test.stderr).trim().slice(-800));
      }
    }
  }
}

// ---------------------------------------------------------------- the report

const known = [];
const failures = [];
for (const result of results) {
  if (result.ok) continue;
  const testCase = cases.find((c) => c.name === result.name);
  const issue = testCase && KNOWN_ISSUES.find((k) => k.match(testCase, result.step));
  (issue ? known : failures).push({ ...result, reason: issue?.reason });
}

console.log(`\n${results.length - failures.length - known.length}/${results.length} checks passed`);

if (known.length) {
  console.log(`\nknown upstream issues (${known.length}):`);
  for (const k of known) console.log(`  ~ ${k.name} :: ${k.step}\n    ${k.reason}`);
}

if (failures.length) {
  console.log(`\nfailures (${failures.length}):`);
  for (const f of failures) console.log(`  ✗ ${f.name} :: ${f.step}\n    ${f.detail || ""}`);
  process.exit(1);
}

console.log("\nall good.");
