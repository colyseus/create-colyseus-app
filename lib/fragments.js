/**
 * Maps a resolved answer set to an ordered list of fragments, and loads their
 * manifests. Order matters: later fragments overlay earlier ones, and snippets
 * are spliced in this same order.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "templates");
const FRAGMENTS_DIR = path.join(ROOT, "fragments");
const PRESETS_DIR = path.join(ROOT, "presets");

/** Per-language subdirectory inside a fragment. */
const LANG_DIR = { typescript: "ts", esm: "esm", cjs: "cjs" };

function loadPreset(name) {
  const file = path.join(PRESETS_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** Fragment ids implied by the answers, in application order. */
function fragmentIdsFor(answers) {
  const ids = [];

  if (answers.layout && answers.layout !== "server") ids.push(`shape-${answers.layout}`);
  if (answers.netcode && answers.netcode !== "none") {
    ids.push(`netcode-${answers.netcode}`);
    // The prediction client only makes sense where there is a browser client.
    if (answers.netcode === "fixed" && answers.layout === "vite") ids.push("netcode-fixed-client");
  }

  for (const feature of answers.matchmaking || []) {
    ids.push(feature === "idle-kick" ? "plugin-idle-kick" : feature);
  }

  // OAuth is additive: it contributes a provider to the module's config file.
  if (answers.auth === "oauth") ids.push("auth-module", "auth-oauth");
  else if (answers.auth && answers.auth !== "none") ids.push(`auth-${answers.auth}`);
  if (answers.database && answers.database !== "none") ids.push(`db-${answers.database}`);

  return ids;
}

/**
 * Load the manifests for the given ids. A fragment without a directory for the
 * chosen language is a bug in options.js (the choice should have been gated by
 * `languages`), so it fails loudly rather than silently generating less.
 */
function loadFragments(ids, language) {
  return ids.map((id) => {
    const dir = path.join(FRAGMENTS_DIR, id);
    const manifestFile = path.join(dir, "manifest.json");
    if (!fs.existsSync(manifestFile)) {
      throw new Error(`Fragment "${id}" has no manifest.json (looked in ${dir}).`);
    }
    const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
    const langDir = path.join(dir, LANG_DIR[language] || language);
    if (!fs.existsSync(langDir)) {
      throw new Error(`Fragment "${id}" has no files for language "${language}".`);
    }
    return { id, dir, langDir, manifest };
  });
}

module.exports = { LANG_DIR, loadPreset, fragmentIdsFor, loadFragments };
