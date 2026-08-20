/**
 * Assembles a project: base tree, then each fragment overlaid on top, then the
 * accumulated snippets spliced into the anchors the base files carry.
 *
 * Anchors are named globally (`@colyseus:server:rooms`) rather than per file, so
 * a fragment that contributes code does not need to know which file it lands in
 * — which is what lets `shape-vite` relocate the whole server tree.
 */

const fs = require("fs");
const path = require("path");

const { LANG_DIR } = require("./fragments");
const {
  mergePackageJson, mergeTsConfig, mergeEnv, mergeGitignore, appendReadmeSections,
} = require("./merge");

/** Never copied into a generated project. */
const IGNORED = new Set([".DS_Store", "node_modules", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "_snippets", "build", "dist"]);

/** Files the anchor splicer will read; everything else is copied untouched. */
const TEXT_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".html", ".md", ".hx", ".hxml"]);

/** Files `{{...}}` substitution reaches — the above plus data files. */
const SUBST_EXT = new Set([...TEXT_EXT, ".json", ".yaml", ".yml"]);

const ANCHOR_RE = /@colyseus:([\w:-]+)/;

/** The full comment form, so an inline anchor can be replaced delimiters and all. */
const ANCHOR_COMMENT_RE = /\/\*\s*@colyseus:([\w:-]+)\s*\*\//g;

function copyTree(from, to) {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (IGNORED.has(entry.name)) continue;

    // npm refuses to publish .gitignore, so templates carry it as _gitignore.
    const name = entry.name === "_gitignore" ? ".gitignore" : entry.name;
    const src = path.join(from, entry.name);
    const dest = path.join(to, name);

    if (entry.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      copyTree(src, dest);
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }
}

function removePath(root, relative) {
  fs.rmSync(path.join(root, relative), { recursive: true, force: true });
}

function movePath(root, from, to) {
  const src = path.join(root, from);
  if (!fs.existsSync(src)) return;
  const dest = path.join(root, to);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(src, dest);
}

function walkFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

/**
 * Replace every `@colyseus:<name>` marker line with the snippets collected for
 * that name, indented to match the marker. Markers with no contributions (and
 * the markers themselves) are dropped, so generated files carry no scaffolding
 * residue.
 */
function spliceAnchors(outputDir, snippets) {
  for (const file of walkFiles(outputDir)) {
    if (!TEXT_EXT.has(path.extname(file))) continue;

    const source = fs.readFileSync(file, "utf8");
    if (!ANCHOR_RE.test(source)) continue;

    const out = [];
    for (const line of source.split("\n")) {
      const match = line.match(ANCHOR_RE);
      if (!match) { out.push(line); continue; }

      // An anchor sharing its line with real code is spliced IN PLACE — that is
      // what lets a fragment chain onto an expression (`defineRoom(MyRoom)` ->
      // `defineRoom(MyRoom).filterBy([...])`) instead of forcing the base file
      // to hoist it into a variable just to be extendable.
      if (line.replace(ANCHOR_COMMENT_RE, "").trim() !== "") {
        ANCHOR_COMMENT_RE.lastIndex = 0;
        out.push(line.replace(ANCHOR_COMMENT_RE, (_, name) =>
          (snippets[name] || []).map((s) => s.trim()).join("")));
        continue;
      }

      const indent = line.match(/^[ \t]*/)[0];
      const contributions = snippets[match[1]] || [];
      contributions.forEach((snippet, i) => {
        if (i > 0) out.push(""); // keep two fragments' contributions apart
        for (const snippetLine of snippet.replace(/\s*$/, "").split("\n")) {
          out.push(snippetLine.length ? indent + snippetLine : "");
        }
      });
    }

    // Collapse the blank runs the removed marker lines leave behind.
    fs.writeFileSync(file, out.join("\n").replace(/\n{3,}/g, "\n\n"));
  }
}

/** Code files the import merger runs over. */
const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

/**
 * Fold repeated named imports of one module into a single statement, so a
 * fragment adding `import { LobbyRoom } from "colyseus"` extends the base
 * file's import instead of standing next to it — the statement a person would
 * have written.
 *
 * Deliberately narrow: only top-level `import { … } from "…"` and
 * `const { … } = require("…")` statements are considered, so default,
 * namespace and side-effect imports are never disturbed.
 */
function mergeDuplicateImports(outputDir) {
  const FORMS = [
    {
      // `type` inside the braces (inline entries) is carried verbatim.
      re: /^import \{([^}]*)\} from "([^"]+)";/gm,
      single: (names, mod) => `import { ${names.join(", ")} } from "${mod}";`,
      multi: (names, mod) => `import {\n${names.map((n) => `  ${n},`).join("\n")}\n} from "${mod}";`,
    },
    {
      re: /^const \{([^}]*)\} = require\("([^"]+)"\);/gm,
      single: (names, mod) => `const { ${names.join(", ")} } = require("${mod}");`,
      multi: (names, mod) => `const {\n${names.map((n) => `  ${n},`).join("\n")}\n} = require("${mod}");`,
    },
  ];

  for (const file of walkFiles(outputDir)) {
    if (!CODE_EXT.has(path.extname(file))) continue;

    let source = fs.readFileSync(file, "utf8");
    let changed = false;

    for (const form of FORMS) {
      const byModule = new Map();
      for (const match of source.matchAll(form.re)) {
        if (!byModule.has(match[2])) byModule.set(match[2], []);
        byModule.get(match[2]).push({
          text: match[0],
          names: match[1].split(",").map((n) => n.trim()).filter(Boolean),
        });
      }

      for (const [mod, statements] of byModule) {
        if (statements.length < 2) continue;
        const names = [...new Set(statements.flatMap((s) => s.names))];
        const merged = (statements[0].text.includes("\n") ? form.multi : form.single)(names, mod);

        source = source.replace(statements[0].text, () => merged);
        for (const extra of statements.slice(1)) source = source.replace(`${extra.text}\n`, "");
        changed = true;
      }
    }

    if (changed) fs.writeFileSync(file, source.replace(/\n{3,}/g, "\n\n"));
  }
}

/**
 * Targeted string edit of a base file. Anchors cover "add code here"; this
 * covers the rarer "the base's own line is wrong for this shape" — e.g. the
 * Vite layout needs the playground off "/" so the client can have it.
 * A `find` that no longer matches is a hard error, never a silent no-op.
 */
function applyPatches(outputDir, fragmentId, patches) {
  for (const patch of patches) {
    const file = path.join(outputDir, patch.file);
    if (!fs.existsSync(file)) {
      throw new Error(`Fragment "${fragmentId}" patches ${patch.file}, which does not exist.`);
    }
    const source = fs.readFileSync(file, "utf8");
    if (!source.includes(patch.find)) {
      throw new Error(`Fragment "${fragmentId}" patches ${patch.file}, but ${JSON.stringify(patch.find)} is not in it.`);
    }
    fs.writeFileSync(file, source.split(patch.find).join(patch.replace));
  }
}

const VAR_RE = /\{\{([\w-]+)\}\}/g;

/**
 * Replace `{{key}}` with the answer it names. Fragments use it for the handful
 * of values that vary per run (the chosen OAuth provider, the project name) —
 * everything else is decided by which fragments apply, not by substitution.
 */
function substituteVars(outputDir, vars) {
  if (!Object.keys(vars).length) return;

  for (const file of walkFiles(outputDir)) {
    if (!SUBST_EXT.has(path.extname(file))) continue;

    const source = fs.readFileSync(file, "utf8");
    if (!VAR_RE.test(source)) continue;

    VAR_RE.lastIndex = 0;
    fs.writeFileSync(file, source.replace(VAR_RE, (match, key) =>
      Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match));
  }
}

/**
 * @param outputDir  destination (already created)
 * @param baseDir    templates/base/<language>
 * @param language   answer value, not the directory name
 * @param fragments  [{ id, langDir, manifest }] in application order
 * @param vars       `{{key}}` replacements, see substituteVars
 */
function compose({ outputDir, baseDir, language, fragments, vars = {} }) {
  copyTree(baseDir, outputDir);

  // Where package.json / tsconfig / .env live. A shape fragment may relocate
  // them (the monorepo puts them under apps/backend), and every later fragment
  // must merge into the moved files, not into fresh ones at the root.
  let appRoot = outputDir;

  const snippets = {};
  const readmeSections = [];
  const env = { development: {}, production: {} };
  const gitignore = [];

  for (const fragment of fragments) {
    const { manifest, langDir, dir } = fragment;

    if (manifest.appRoot) appRoot = path.join(outputDir, manifest.appRoot);

    // A shape fragment lays out the whole repository, so its paths are
    // root-relative; every other fragment works inside the app it extends —
    // under the monorepo shape, that is apps/backend, not the root.
    const root = manifest.appRoot ? outputDir : appRoot;

    for (const relative of manifest.removes || []) removePath(root, relative);
    for (const [from, to] of Object.entries(manifest.moves || {})) movePath(root, from, to);

    copyTree(langDir, root);

    applyPatches(root, fragment.id, manifest.patches || []);

    for (const [anchor, file] of Object.entries(manifest.snippets || {})) {
      const snippetFile = path.join(langDir, "_snippets", file);
      if (!fs.existsSync(snippetFile)) {
        throw new Error(`Fragment "${fragment.id}" declares snippet "${file}" for @colyseus:${anchor}, but ${snippetFile} does not exist.`);
      }
      (snippets[anchor] ||= []).push(fs.readFileSync(snippetFile, "utf8"));
    }

    mergePackageJson(path.join(appRoot, "package.json"), manifest);
    if (manifest.tsconfig) mergeTsConfig(path.join(appRoot, "tsconfig.json"), manifest.tsconfig);

    for (const scope of ["all", "development", "production"]) {
      if (!manifest.env || !manifest.env[scope]) continue;
      const targets = scope === "all" ? ["development", "production"] : [scope];
      for (const target of targets) Object.assign(env[target], manifest.env[scope]);
    }

    gitignore.push(...(manifest.gitignore || []));

    const readme = path.join(dir, "README.md");
    if (fs.existsSync(readme)) readmeSections.push(fs.readFileSync(readme, "utf8").trim());
  }

  spliceAnchors(outputDir, snippets);
  mergeDuplicateImports(outputDir);

  for (const scope of ["development", "production"]) {
    if (!Object.keys(env[scope]).length) continue;
    mergeEnv(path.join(appRoot, `.env.${scope}`), env[scope]);
  }
  mergeGitignore(path.join(outputDir, ".gitignore"), gitignore);
  appendReadmeSections(path.join(outputDir, "README.md"), readmeSections);

  // Last, so the fragment README sections appended above are reached too.
  substituteVars(outputDir, {
    ...vars,
    // Lets docs point at files wherever the shape put them: "" or "apps/backend/".
    "app-prefix": appRoot === outputDir ? "" : `${path.relative(outputDir, appRoot)}/`,
    "src-ext": language === "typescript" ? "ts" : "js",
  });

  return { language, langDir: LANG_DIR[language], appRoot };
}

module.exports = { compose };
