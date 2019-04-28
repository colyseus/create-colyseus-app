#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const rimraf = require('rimraf');

function exec(args, onclose) {
  const child = spawn(args.shift(), args);

  child.stdout.on('data', function(data) {
    console.log(data.toString());
  });

  child.on("close", onclose);
}

inquirer.prompt([
  {
    type: 'list',
    name: 'language',
    message: "Which language you'd like to use?",
    choices: ['TypeScript (recommended)', 'JavaScript', 'Haxe']
  }
]).then((value => {
  let folderName = '.';

  let branchName = 'typescript';

  if (value.language.indexOf("JavaScript") !== -1) {
    branchName = 'javascript';

  } else if (value.language.indexOf("Haxe") !== -1) {
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
      console.error(`${folderName} directory must be empty!`);
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

}));
