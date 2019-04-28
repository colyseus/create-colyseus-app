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
  let folderName = '.';

  let branchName = 'typescript';

  if (language.indexOf("JavaScript") !== -1) {
    branchName = 'javascript';

  } else if (language.indexOf("Haxe") !== -1) {
    branchName = 'haxe';
  }

  if (process.argv.length >= 3) {
    folderName = process.argv[2];
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName);
    }
  }

  console.log("Downloading template...")
  exec(["git", "clone", "--depth=1", "--single-branch", "--branch", branchName, "https://github.com/endel/create-colyseus-app.git", folderName], function(code) {
    if (code !== 0) {
      console.error(`ERROR: '${folderName}' directory must be empty!`);
      process.exit(code);
    } else {
      rimraf.sync(path.resolve(folderName, '.git'));
      console.log("Installing dependencies...")

      exec(["npm", "install", "--prefix", folderName], function(code) {
        console.log("");
        console.log(`All set! ${branchName} project bootstraped at:`, folderName);
        console.log("");
        console.log("⚔️  It's time to kick ass and chew bubble gum!");
      });
    }
  })

}).catch(e => {
  // cancelled
});
