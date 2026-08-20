#!/usr/bin/env node

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { parseArgs, renderHelp, renderList, CliError } = require('./lib/args');
const { resolveAnswers } = require('./lib/resolve');
const { askAxis, askProjectName } = require('./lib/prompts');
const { loadPreset, fragmentIdsFor, loadFragments } = require('./lib/fragments');
const { compose } = require('./lib/compose');
const { buildVars } = require('./lib/options');
const { brandPackageJson } = require('./lib/merge');

const pkg = require('./package.json');

const isBun = (typeof (Bun) !== "undefined" || (process.env.npm_config_user_agent && process.env.npm_config_user_agent.indexOf("bun") >= 0));

function exec(args, onclose) {
  const child = spawn(args.shift(), args, { shell: true });
  child.stdout.on('data', (data) => console.log(data.toString()));
  child.on("close", onclose);
}

function packageManager() {
  if (isBun) return 'bun';
  if (/yarn/.test(process.env.npm_execpath || '')) return 'yarn';
  if (/pnpm/.test(process.env.npm_execpath || '')) return 'pnpm';
  return 'npm';
}

/** npm package names are lowercase and URL-safe; project directories are not. */
function toPackageName(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^[._]+/, '')
    .replace(/[^a-z0-9-~._]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'colyseus-app';
}

function assertWritable(dir, overwrite) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir).filter((name) => name !== '.git');
  if (!entries.length || overwrite) return;
  throw new CliError(
    `Target directory "${dir}" is not empty:\n` +
    `  ${entries.slice(0, 8).join(', ')}${entries.length > 8 ? `, …(${entries.length - 8} more)` : ''}\n` +
    `Pass --overwrite to write into it anyway.`
  );
}

async function main() {
  const startCwd = process.cwd();
  const { dir, given, switches } = parseArgs(process.argv.slice(2));

  if (switches.help) { console.log(renderHelp(pkg.version)); return; }
  if (switches.version) { console.log(pkg.version); return; }
  if (switches.list) { console.log(renderList()); return; }

  // No TTY (CI, piped input) behaves exactly like --yes, so one command works in both.
  const interactive = Boolean(process.stdin.isTTY) && !switches.yes;

  let target = dir;
  if (!target) {
    target = interactive ? await askProjectName('my-colyseus-app') : '.';
  }
  const outputDir = path.resolve(target);

  // Before the questions, not after: nobody wants to answer six prompts and
  // then be told the directory was never usable.
  assertWritable(outputDir, switches.overwrite);

  const answers = await resolveAnswers({
    given,
    ask: interactive ? askAxis : null,
    loadPreset,
  });

  fs.mkdirSync(outputDir, { recursive: true });

  const baseDir = answers.language === 'haxe'
    ? path.resolve(__dirname, 'templates', 'haxe')
    : path.resolve(__dirname, 'templates', 'base', answers.language);

  const fragmentIds = answers.language === 'haxe' ? [] : fragmentIdsFor(answers);
  const fragments = loadFragments(fragmentIds, answers.language);

  const name = toPackageName(switches.name || path.basename(outputDir));

  compose({
    outputDir,
    baseDir,
    language: answers.language,
    fragments,
    vars: { ...buildVars(answers), name },
  });

  brandPackageJson(path.join(outputDir, 'package.json'), {
    name,
    description: 'A Colyseus multiplayer server',
  });

  console.info(`✂️  Created ${answers.language} project at ${outputDir}`);
  if (fragmentIds.length) console.info(`   Included: ${fragmentIds.join(', ')}`);

  process.chdir(outputDir);

  if (switches.git) {
    spawnSync('git', ['init', '-q'], { stdio: 'inherit' });
    spawnSync('git', ['add', '-A'], { stdio: 'inherit' });
    spawnSync('git', ['commit', '-q', '-m', 'Initial commit'], { stdio: 'inherit' });
  }

  if (!switches.install) {
    console.log("");
    console.log("All set! Next steps:");
    const relative = path.relative(startCwd, outputDir);
    if (relative) console.log(`  cd ${relative}`);
    console.log(`  ${packageManager()} install`);
    console.log(`  ${packageManager()} start`);
    return;
  }

  const manager = packageManager();
  const managerCmd = (/^win/.test(process.platform) && manager !== "bun") ? `${manager}.cmd` : manager;
  console.log(`📦 Installing dependencies... (${manager} install)`);

  await new Promise((resolve) => exec([managerCmd, "install"], resolve));

  console.log("");
  console.log(`All set! ${answers.language} server created at:`, outputDir);
  console.log("");
  console.log("⚔️  It's time to kick ass and chew bubblegum!");
}

main().catch((error) => {
  if (error instanceof CliError) {
    console.error(`\n${error.message}\n`);
    process.exit(1);
  }
  // enquirer rejects with undefined when the user hits Ctrl+C.
  if (error === undefined || error === '') return;
  console.error(error);
  process.exit(1);
});
