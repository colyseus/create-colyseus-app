/**
 * Turns partial answers from the command line into a complete answer set.
 *
 * Per axis, in schema order: explicit flag -> preset -> prompt -> default.
 * The prompt step is skipped when `ask` is null (--yes, or stdin is not a TTY),
 * so the exact same command works in a script and in a terminal.
 */

const { AXES, isAvailable, shouldAsk, choicesFor } = require("./options");
const { CliError } = require("./args");

function listValues(axis, language) {
  const usable = choicesFor(axis, language).map((c) => c.value);
  const hidden = axis.choices.filter((c) => !usable.includes(c.value));
  let msg = `Valid values for ${axis.flag}: ${usable.join(", ")}`;
  if (hidden.length) {
    msg += `\n${hidden.map((c) => `  "${c.value}" is only available with --language ${c.languages.join(" or ")}`).join("\n")}`;
  }
  return msg;
}

function validate(axis, value, language) {
  const usable = choicesFor(axis, language).map((c) => c.value);
  const values = axis.type === "many-of" ? value : [value];
  for (const v of values) {
    if (!usable.includes(v)) {
      throw new CliError(`"${v}" is not a valid value for ${axis.flag}.\n${listValues(axis, language)}`);
    }
  }
  return axis.type === "many-of" ? [...new Set(values)] : value;
}

/**
 * @param given    answers parsed from argv
 * @param ask      async (axis, answers, choices) => value, or null to never prompt
 * @param loadPreset (name) => ({ answers }) | null
 */
async function resolveAnswers({ given, ask, loadPreset }) {
  const answers = {};
  let preset = null;

  for (const axis of AXES) {
    if (!isAvailable(axis, answers)) {
      if (given[axis.id] !== undefined) {
        throw new CliError(`${axis.flag} does not apply here (it is not available with --language ${answers.language}).`);
      }
      continue;
    }

    let value = given[axis.id];

    if (value === undefined && preset && preset.answers[axis.id] !== undefined) {
      value = preset.answers[axis.id];
    }

    if (value === undefined && ask && shouldAsk(axis, answers)) {
      const choices = choicesFor(axis, answers.language);
      // A single remaining choice is not a question worth asking.
      value = choices.length > 1 ? await ask(axis, answers, choices) : choices[0].value;
    }

    if (value === undefined) value = axis.default;

    answers[axis.id] = validate(axis, value, answers.language);

    if (axis.id === "preset") {
      preset = loadPreset(answers.preset);
      if (!preset && answers.preset !== "custom") {
        throw new CliError(`No preset definition found for "${answers.preset}".`);
      }
    }
  }

  return answers;
}

module.exports = { resolveAnswers };
