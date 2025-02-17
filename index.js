#!/usr/bin/env node

const { spawn } = require('child_process');
const { Select } = require('enquirer');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const recursiveCopy = require('recursive-copy');

const isBun = (typeof(Bun) !== "undefined" || (process.env.npm_config_user_agent && process.env.npm_config_user_agent.indexOf("bun") >= 0));

function exec(args, onclose) {
  const child = spawn(args.shift(), args, { shell: true });

  child.stdout.on('data', function(data) {
    console.log(data.toString());
  });

  child.on("close", onclose);
}

const prompt = new Select({
    name: 'language',
    message: "Which template you'd like to use?",
    choices: ['TypeScript (recommended)', 'JavaScript - ESM', 'JavaScript - CommonJS', 'Haxe (experimental)']
});

prompt.run().then(language => {
  let outputDir = '.';
  let templateName = 'typescript';

  if (language.indexOf("ESM") !== -1) {
    templateName = 'esm';

  } else if (language.indexOf("CommonJS") !== -1) {
    templateName = 'javascript';

  } else if (language.indexOf("Haxe") !== -1) {
    templateName = 'haxe';
  }

  if (process.argv.length >= 3) {
    outputDir = process.argv[2];
  }

  outputDir = path.resolve(outputDir);

  // ensure outputFolder exists.
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // TODO: check "git status" before removing .git
  rimraf.sync(path.resolve(outputDir, '.git'));

  const options = { dot: true, };

  recursiveCopy(path.resolve(__dirname, "templates", templateName), outputDir, options, function (err, results) {
    if (err) {
      console.log(err);
      console.log(err.stack);
      return console.error('Copy failed: ' + err);
    }
    console.info(`✂️  Created ${results.length} files.`);

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
