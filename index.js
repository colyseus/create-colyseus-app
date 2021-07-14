#!/usr/bin/env node

const { spawn } = require('child_process');
const { Select } = require('enquirer');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

function exec(args, onclose) {
  const child = spawn(args.shift(), args);

  child.stdout.on('data', function(data) {
    console.log(data.toString());
  });

  child.on("close", onclose);
}

const prompt = new Select({
    name: 'language',
    message: "Which language you'd like to use?",
    choices: ['TypeScript (recommended)', 'JavaScript', 'Haxe']
});

prompt.run().then(language => {
  let outputDir = '.';

  let branchName = 'typescript';

  if (language.indexOf("JavaScript") !== -1) {
    branchName = 'javascript';

  } else if (language.indexOf("Haxe") !== -1) {
    branchName = 'haxe';
  }

  if (process.argv.length >= 3) {
    outputDir = process.argv[2];
  }

  outputDir = path.resolve(outputDir);

  // ensure outputFolder exists.
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  console.log("Downloading template...")
  exec(["git", "clone", "--depth=1", "--single-branch", "--branch", branchName, "https://github.com/colyseus/create-colyseus-app.git", outputDir], function (code) {
    if (code !== 0) {
      console.error(`ERROR: '${outputDir}' directory must be empty!`);
      process.exit(code);
    } else {
      rimraf.sync(path.resolve(outputDir, '.git'));

      console.log("Installing dependencies...")
      const npmCmd = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';

      // npm install with --prefix causes issues on Windows. need to enter the directory first.
      process.chdir(outputDir);
      process.cwd();

      exec([npmCmd, "install"], function (code) {
        console.log("");
        console.log(`All set! ${branchName} project bootstraped at:`, outputDir);
        console.log("");
        console.log("⚔️  It's time to kick ass and chew bubblegum!");
      });
    }
  })

}).catch(e => {
  // cancelled
});
