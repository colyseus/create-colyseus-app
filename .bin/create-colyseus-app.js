#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const rimraf = require('rimraf');

inquirer.prompt([
  {
    type: 'list',
    name: 'language',
    message: "Which language you'd like to use?",
    choices: ['TypeScript (recommended)', 'JavaScript']
  }
]).then((value => {
  let folderName = '.';

  const branchName = (value.language.indexOf("TypeScript") !== -1)
    ? "javascript"
    : "typescript";

  if (process.argv.length >= 3) {
    folderName = process.argv[2];
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName);
    }
  }

  const clone = spawn("git", ["clone", "--depth=1", "--single-branch", "--branch", branchName, "https://github.com/endel/create-colyseus-app.git", folderName]);

  clone.on("close", code => {
    if (code !== 0) {
      console.error(`${folderName} directory must be empty!`);
      process.exit(code);
    } else {
      rimraf.sync(path.resolve(folderName, '.git'));
      console.log("");
      console.log(`All set! ${branchName} project bootstraped at:`, folderName);
      console.log("");
      console.log("⚔️  It's time to kick ass and chew bubble gum!");
    }
  });

}));
