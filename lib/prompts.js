/**
 * Interactive side of the option schema. Every prompt here is generated from an
 * axis in lib/options.js — there is no hand-written question list.
 */

const { Select, MultiSelect, Input } = require("enquirer");

const toChoice = (c) => ({ name: c.value, message: c.title, hint: c.hint ? `(${c.hint})` : undefined });

/** Ask one axis. Returns the chosen value (or array, for "many-of"). */
async function askAxis(axis, answers, choices) {
  const Prompt = axis.type === "many-of" ? MultiSelect : Select;
  const prompt = new Prompt({
    name: axis.id,
    message: axis.message,
    choices: choices.map(toChoice),
    ...(axis.type === "many-of"
      ? { initial: axis.default, hint: "(space to select, enter to confirm)" }
      : { initial: choices.findIndex((c) => c.value === axis.default) }),
  });
  return prompt.run();
}

/** Only asked when no target directory was given on the command line. */
async function askProjectName(initial) {
  const prompt = new Input({ name: "name", message: "Project name?", initial });
  return prompt.run();
}

module.exports = { askAxis, askProjectName };
