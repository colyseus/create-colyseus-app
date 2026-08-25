/**
 * argv -> { dir, given, switches }, driven entirely by lib/options.js.
 *
 * Values are recorded raw here; validating them needs the resolved language
 * (some choices only exist for TypeScript), so that happens in lib/resolve.js.
 */

const { AXES, SWITCHES, choiceNames } = require("./options");

class CliError extends Error {}

const SHORTHANDS = new Map();
for (const axis of AXES) {
  if (!axis.shorthand) continue;
  for (const choice of axis.choices) {
    for (const name of choiceNames(choice)) SHORTHANDS.set(`--${name}`, [axis.id, choice.value]);
  }
}

const AXIS_BY_FLAG = new Map(AXES.map((axis) => [axis.flag, axis]));
const SWITCH_BY_FLAG = new Map();
for (const s of SWITCHES) {
  SWITCH_BY_FLAG.set(s.flag, s);
  if (s.alias) SWITCH_BY_FLAG.set(s.alias, s);
}

const key = (flag) => flag.replace(/^--?/, "");

function parseArgs(argv) {
  const given = {};
  const switches = {};
  let dir = null;

  for (const s of SWITCHES) {
    if (s.boolean && s.default !== undefined) switches[key(s.flag)] = s.default;
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (!arg.startsWith("-")) {
      if (dir !== null) throw new CliError(`Unexpected argument "${arg}" (the target directory is already "${dir}").`);
      dir = arg;
      continue;
    }

    // --flag=value
    const eq = arg.indexOf("=");
    const flag = eq === -1 ? arg : arg.slice(0, eq);
    const inlineValue = eq === -1 ? null : arg.slice(eq + 1);

    // `--no-x`: clears a many-of axis, or turns off a negatable switch
    if (flag.startsWith("--no-")) {
      const positive = `--${flag.slice(5)}`;
      const axis = AXIS_BY_FLAG.get(positive);
      if (axis && axis.type === "many-of") { given[axis.id] = []; continue; }
      const sw = SWITCH_BY_FLAG.get(positive);
      if (sw && sw.negatable) { switches[key(positive)] = false; continue; }
      throw new CliError(`Unknown option "${flag}". Run with --help to see the available options.`);
    }

    const shorthand = SHORTHANDS.get(flag);
    if (shorthand && inlineValue === null) {
      given[shorthand[0]] = shorthand[1];
      continue;
    }

    const axis = AXIS_BY_FLAG.get(flag);
    if (axis) {
      const value = inlineValue !== null ? inlineValue : argv[++i];
      if (value === undefined || value.startsWith("-")) {
        throw new CliError(`Option "${flag}" needs a value. Run with --help to see the available values.`);
      }
      if (axis.type === "many-of") {
        const parts = value.split(",").map((v) => v.trim()).filter(Boolean);
        given[axis.id] = [...(given[axis.id] || []), ...parts];
      } else {
        given[axis.id] = value;
      }
      continue;
    }

    const sw = SWITCH_BY_FLAG.get(flag);
    if (sw) {
      if (sw.boolean) {
        switches[key(sw.flag)] = true;
      } else {
        const value = inlineValue !== null ? inlineValue : argv[++i];
        if (value === undefined) throw new CliError(`Option "${flag}" needs a value.`);
        switches[key(sw.flag)] = value;
      }
      continue;
    }

    throw new CliError(`Unknown option "${flag}". Run with --help to see the available options.`);
  }

  return { dir, given, switches };
}

function renderHelp(version) {
  const lines = [];
  lines.push(`create-colyseus-app ${version}`);
  lines.push("");
  lines.push("Usage:");
  lines.push("  npx create-colyseus-app@latest [directory] [options]");
  lines.push("  npm create colyseus-app@latest [directory] -- [options]");
  lines.push("");
  lines.push("Anything not passed as an option is asked interactively.");
  lines.push("With --yes (or when stdin is not a TTY) the defaults are used instead.");
  lines.push("");
  lines.push("Options:");

  for (const axis of AXES) {
    const values = axis.choices.map((c) => c.value).join(" | ");
    lines.push(`  ${axis.flag} <${values}>`);
    lines.push(`      ${axis.message} (default: ${JSON.stringify(axis.default)})`);
    if (axis.type === "many-of") lines.push(`      comma-separated and repeatable; --no-${key(axis.flag)} clears it`);
    if (axis.shorthand) {
      const shorts = axis.choices.flatMap((c) => choiceNames(c).map((n) => `--${n}`));
      lines.push(`      shorthand: ${shorts.join(", ")}`);
    }
    const restricted = axis.choices.filter((c) => c.languages);
    for (const c of restricted) lines.push(`      "${c.value}" requires --language ${c.languages.join(" or ")}`);
  }

  for (const s of SWITCHES) {
    const name = s.alias ? `${s.alias}, ${s.flag}` : s.flag;
    lines.push(`  ${name}${s.value ? ` ${s.value}` : ""}`);
    lines.push(`      ${s.describe}`);
  }

  lines.push("");
  lines.push("Examples:");
  lines.push("  npm create colyseus-app@latest my-game -- --typescript --preset realtime-action --yes");
  lines.push("  npm create colyseus-app@latest my-game -- --ts --layout vite --netcode fixed \\");
  lines.push("      --matchmaking lobby,reconnection --auth module --database colyseus --yes");
  return lines.join("\n");
}

/** Machine-readable schema dump — feeds the docs and the smoke test. */
function renderList() {
  return JSON.stringify({
    axes: AXES.map((axis) => ({
      id: axis.id,
      flag: axis.flag,
      type: axis.type,
      default: axis.default,
      choices: axis.choices.map((c) => ({
        value: c.value,
        title: c.title,
        hint: c.hint,
        aliases: c.aliases,
        languages: c.languages,
      })),
    })),
    switches: SWITCHES,
  }, null, 2);
}

module.exports = { parseArgs, renderHelp, renderList, CliError };
