#!/usr/bin/env node

const { spawn } = require('child_process');
const { Select } = require('enquirer');
const fs = require('fs');
const path = require('path');
const recursiveCopy = require('recursive-copy');

const isBun = (typeof(Bun) !== "undefined" || (process.env.npm_config_user_agent && process.env.npm_config_user_agent.indexOf("bun") >= 0));

// Parse command-line flags for template selection
const args = process.argv.slice(2);
const templateFlag = args.find(arg => ['--esm', '--cjs', '--typescript'].includes(arg));
const nonFlagArgs = args.filter(arg => !arg.startsWith('--'));

function exec(args, onclose) {
  const child = spawn(args.shift(), args, { shell: true });

  child.stdout.on('data', function(data) {
    console.log(data.toString());
  });

  child.on("close", onclose);
}

// Determine template from flag or prompt
function getTemplateFromFlag(flag) {
  switch (flag) {
    case '--esm': return 'esm';
    case '--cjs': return 'cjs';
    case '--typescript': return 'typescript';
    default: return null;
  }
}

function getTemplateFromLanguage(language) {
  if (language.indexOf("ESM") !== -1) return 'esm';
  if (language.indexOf("CJS") !== -1) return 'cjs';
  if (language.indexOf("Haxe") !== -1) return 'haxe';
  return 'typescript';
}

async function selectTemplate() {
  if (templateFlag) {
    return getTemplateFromFlag(templateFlag);
  }

  const prompt = new Select({
    name: 'language',
    message: "Which template you'd like to use?",
    choices: ['TypeScript (recommended)', 'JavaScript - ESM', 'JavaScript - CJS (legacy)', 'Haxe (not up-to-date: use at your own risk)']
  });

  const language = await prompt.run();
  return getTemplateFromLanguage(language);
}

selectTemplate().then(templateName => {
  let outputDir = nonFlagArgs[0] || '.';

  outputDir = path.resolve(outputDir);

  // ensure outputFolder exists.
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const options = {
    dot: true,
    overwrite: false,
  };

  recursiveCopy(path.resolve(__dirname, "templates", templateName), outputDir, options, function (err, results) {
    if (err) {
      console.log(err);
      console.log(err.stack);
      return console.error('Copy failed: ' + err);
    }
    console.info(`✂️  Created ${results.length} files.`);

    // rename _gitignore to .gitignore (NPM does not let publishing .gitignore files)
    fs.renameSync(path.join(outputDir, "_gitignore"), path.join(outputDir, ".gitignore"));

    const pkgManager = (isBun)
      ? 'bun'
      : (/yarn/.test(process.env.npm_execpath))
        ? 'yarn'
        : 'npm';
    const pkgManagerCmd = (/^win/.test(process.platform) && pkgManager !== "bun") ? `${pkgManager}.cmd` : pkgManager;

    console.log(`📦 Installing dependencies... (${pkgManager} install)`);

    // npm install with --prefix causes issues on Windows. need to enter the directory first.
    process.chdir(outputDir);
    process.cwd();

    exec([pkgManagerCmd, "install"], function (code) {
      console.log("");
      console.log(`All set! ${templateName} server created at:`, outputDir);
      console.log("");
      console.log("⚔️  It's time to kick ass and chew bubblegum!");
    });
  });

}).catch(e => {
  // cancelled
});
