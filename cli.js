#!/usr/bin/env node

"use strict";

const inquirer = require("inquirer");
const util = require("util");
const execFile = util.promisify(require("child_process").execFile);
const chalkPipe = require("chalk-pipe");

const getReleaseBranches = async () => {
  const { err, stdout, stderr } = await execFile("git", ["ls-remote"]);

  if (err !== undefined) {
    throw new Error(
      "Could not get remote branches, make sure you git is initialized."
    );
  }

  var lines = stdout.split("\n");
  const branches = lines
    .map((line) => {
      const baseBranch = line.split("\t")[1];
      if (baseBranch && baseBranch.includes("refs/heads/release")) {
        return {
          name: baseBranch.split("refs/heads/")[1],
        };
      }
      return false;
    })
    .filter(Boolean);
  return branches;
};

const init = async () => {
  const myArgs = process.argv.slice(2);

  try {
    const releaseBranches = await getReleaseBranches();

    if (releaseBranches.length === 0) {
      throw new Error(
        "There are no release branches on this repository, create one first."
      );
    }

    const answers = await inquirer.prompt([
      {
        type: "list",
        message:
          "From which release branch would you like to start a new feature?",
        name: "parent",
        choices: releaseBranches,
        validate: function (answer) {
          if (answer.length < 1) {
            return "You must choose at least one topping.";
          }

          return true;
        },
      },
      {
        type: "input",
        name: "name",
        default: myArgs[0],
        message: `What will be the name of your feature branch ${chalkPipe(
          "yellow"
        )('(don\'t add "feature/")')}`,
      },
    ]);

    await execFile("git", [
      "checkout",
      "-b",
      `feature/${answers.name}`,
      "--no-track",
      `origin/${answers.parent}`,
    ]);

    // await execFile("git", ["checkout", `feature/${answers.name}`]);
  } catch (error) {
    console.log(error);
  }
};

init();
