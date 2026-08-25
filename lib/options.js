/**
 * The single source of truth for every question the generator can ask.
 *
 * `lib/args.js` (flags + --help + --list), `lib/prompts.js` (interactive), and
 * `scripts/smoke.mjs` (test matrix) are all derived from this array — adding an
 * axis means editing here and nowhere else.
 *
 * Axis fields:
 *   id          answer key
 *   flag        `--<name>` accepted on the command line
 *   type        "one-of" | "many-of"
 *   choices     [{ value, title, hint?, aliases?, languages? }]
 *               `languages` restricts a choice to those base languages
 *   shorthand   each choice value/alias is ALSO accepted as a bare flag (--esm)
 *   default     used by --yes / non-TTY / when a prompt is skipped
 *   available   hard gate: a flag for an unavailable axis is an error
 *   ask         soft gate: false means "don't prompt, but the flag still works"
 */

const AXES = [
  {
    id: "language",
    flag: "--language",
    type: "one-of",
    shorthand: true,
    message: "Which language would you like to use?",
    default: "typescript",
    choices: [
      { value: "typescript", title: "TypeScript", hint: "recommended", aliases: ["ts"] },
      { value: "esm", title: "JavaScript — ESM" },
      { value: "cjs", title: "JavaScript — CJS", hint: "legacy" },
      { value: "haxe", title: "Haxe", hint: "by @serjek" },
    ],
  },

  {
    id: "preset",
    flag: "--preset",
    type: "one-of",
    message: "What are you building?",
    default: "minimal",
    available: (a) => a.language !== "haxe",
    choices: [
      { value: "minimal", title: "Minimal server", hint: "a single room, nothing else" },
      { value: "realtime-action", title: "Realtime action", hint: "authoritative tick + client prediction", languages: ["typescript"] },
      { value: "turn-based", title: "Turn-based", hint: "turn order, turn timer" },
      { value: "custom", title: "Custom", hint: "ask me everything" },
    ],
  },

  {
    id: "layout",
    flag: "--layout",
    type: "one-of",
    message: "Project layout?",
    default: "server",
    available: (a) => a.language !== "haxe",
    ask: (a) => a.preset === "custom",
    choices: [
      { value: "server", title: "Server only" },
      { value: "vite", title: "Single Vite project", hint: "client + server + shared", languages: ["typescript"] },
      { value: "monorepo", title: "pnpm monorepo", hint: "apps/backend + apps/frontend", languages: ["typescript"] },
    ],
  },

  {
    id: "netcode",
    flag: "--netcode",
    type: "one-of",
    message: "How does the game advance?",
    default: "none",
    available: (a) => a.language !== "haxe",
    ask: (a) => a.preset === "custom",
    choices: [
      { value: "none", title: "No game loop", hint: "messages only" },
      { value: "fixed", title: "Fixed tick + client prediction", hint: "setFixedTimestep + defineInput", languages: ["typescript"] },
      { value: "tick", title: "Simple server tick", hint: "setTimestep, no prediction" },
      { value: "turn-based", title: "Turn-based", hint: "turn order + deadline" },
      { value: "relay", title: "Relay", hint: "client-authoritative transforms" },
    ],
  },

  {
    id: "matchmaking",
    flag: "--matchmaking",
    type: "many-of",
    message: "Matchmaking & room features?",
    default: [],
    available: (a) => a.language !== "haxe",
    ask: (a) => a.preset === "custom",
    choices: [
      { value: "lobby", title: "Lobby room", hint: "realtime room listing" },
      { value: "filterby", title: "filterBy", hint: "match players by a join option" },
      { value: "reconnection", title: "Reconnection", hint: "onDrop + allowReconnection" },
      { value: "idle-kick", title: "Idle kick plugin" },
    ],
  },

  {
    id: "auth",
    flag: "--auth",
    type: "one-of",
    message: "Authentication?",
    default: "none",
    available: (a) => a.language !== "haxe",
    ask: (a) => a.preset === "custom",
    choices: [
      { value: "none", title: "None" },
      { value: "onauth", title: "Room onAuth()", hint: "validate a token yourself, no deps" },
      { value: "module", title: "@colyseus/auth", hint: "anonymous + email/password" },
      { value: "oauth", title: "@colyseus/auth + OAuth", languages: ["typescript"] },
    ],
  },

  {
    id: "oauth-provider",
    flag: "--oauth-provider",
    type: "one-of",
    message: "Which OAuth provider?",
    default: "discord",
    available: (a) => a.language !== "haxe",
    ask: (a) => a.auth === "oauth",
    choices: [
      // `vars` land in the generator's {{...}} substitutions — each provider
      // names its own scopes.
      { value: "discord", title: "Discord", vars: { "oauth-scope": '["identify", "email"]' } },
      { value: "google", title: "Google", vars: { "oauth-scope": '["profile", "email"]' } },
      { value: "github", title: "GitHub", vars: { "oauth-scope": '["user:email"]' } },
      { value: "twitch", title: "Twitch", vars: { "oauth-scope": '["user:read:email"]' } },
    ],
  },

  {
    id: "database",
    flag: "--database",
    type: "one-of",
    message: "Persistence?",
    default: "none",
    available: (a) => a.language !== "haxe",
    ask: (a) => a.preset === "custom",
    choices: [
      { value: "none", title: "None" },
      { value: "colyseus", title: "@colyseus/database", hint: "SQLite in dev, Postgres in prod", languages: ["typescript"] },
    ],
  },
];

/** Flags that are not answers to an axis. */
const SWITCHES = [
  { flag: "--name", value: "<pkg-name>", describe: "package name (default: target directory name)" },
  { flag: "--yes", alias: "-y", boolean: true, describe: "never prompt; use defaults for anything unspecified" },
  { flag: "--install", boolean: true, negatable: true, default: true, describe: "install dependencies (--no-install to skip)" },
  { flag: "--git", boolean: true, negatable: true, default: false, describe: "run `git init` and create the first commit" },
  { flag: "--overwrite", boolean: true, describe: "allow writing into a non-empty directory" },
  { flag: "--list", boolean: true, describe: "print every axis and its valid values as JSON" },
  { flag: "--help", alias: "-h", boolean: true, describe: "show this help" },
  { flag: "--version", alias: "-v", boolean: true, describe: "print the version" },
];

/** Is this axis relevant at all, given what has been answered so far? */
function isAvailable(axis, answers) {
  return typeof axis.available === "function" ? axis.available(answers) : true;
}

/** Should this axis be asked interactively? (a flag bypasses this) */
function shouldAsk(axis, answers) {
  if (!isAvailable(axis, answers)) return false;
  return typeof axis.ask === "function" ? axis.ask(answers) : true;
}

/** Choices left after filtering out the ones this language has no fragment for. */
function choicesFor(axis, language) {
  return axis.choices.filter((c) => !c.languages || c.languages.includes(language));
}

/** Accepted spellings of a choice: its value plus any aliases. */
function choiceNames(choice) {
  return [choice.value, ...(choice.aliases || [])];
}

/**
 * `{{key}}` replacements available to fragments: every answer by axis id, plus
 * whatever `vars` the selected choice declares.
 */
function buildVars(answers) {
  const vars = {};
  for (const axis of AXES) {
    const value = answers[axis.id];
    if (value === undefined) continue;

    vars[axis.id] = Array.isArray(value) ? value.join(",") : String(value);

    if (axis.type === "one-of") {
      const choice = axis.choices.find((c) => c.value === value);
      if (choice && choice.vars) Object.assign(vars, choice.vars);
    }
  }
  return vars;
}

module.exports = { AXES, SWITCHES, isAvailable, shouldAsk, choicesFor, choiceNames, buildVars };
