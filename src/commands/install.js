"use strict";

const fs = require("fs");
const path = require("path");
const {
  VERSION,
  readConfig,
  writeConfig,
  getSkillsDir,
  getInstructionsDir,
  resolvePaths,
} = require("../config");

function copyFileSync(src, destDir, filename) {
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, path.join(destDir, filename));
}

function copyDirRecursive(srcDir, destDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Install all skills into `<scope>/.claude/skills/`.
 *
 * Every template skill is installed by this function — there are no
 * optional skill bundles and no agents. Skills drive the entire workflow:
 * initial setup (`sdlc-wizard`), task orchestration (`sdlc-council`), planning
 * (`sdlc-implementation-plan`, `sdlc-planner`), coding (`sdlc-coder`), review
 * (`sdlc-reviewer`), debugging (`sdlc-bug-fixer`), pre-plan critique
 * (`sdlc-implementation-debate`), and per-step setup (`sdlc-devcontainer-setup`,
 * `sdlc-graphify-setup`).
 *
 * When `selected` is provided, only those skill directory names are
 * installed (used by `wizard install skills`).
 */
function installSkills(cwd, scope, selected) {
  scope = scope || "project";
  const paths = resolvePaths(cwd, scope);
  const skillsDir = getSkillsDir();
  const targetDir = path.join(paths.claudeBase, "skills");

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const skillNames = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (selected && !selected.includes(entry.name)) continue;
    copyDirRecursive(
      path.join(skillsDir, entry.name),
      path.join(targetDir, entry.name)
    );
    skillNames.push(entry.name);
  }

  return skillNames;
}

/**
 * Install global coding instructions into `<scope>/.claude/instructions/`.
 *
 * The instructions are shared coding standards applied to all generated
 * code — not tied to any single skill.
 */
function installInstructions(cwd, scope) {
  scope = scope || "project";
  const paths = resolvePaths(cwd, scope);
  const instructionsDir = getInstructionsDir();
  const targetDir = path.join(paths.claudeBase, "instructions");

  if (!fs.existsSync(instructionsDir)) {
    return [];
  }

  const files = fs
    .readdirSync(instructionsDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name);

  for (const file of files) {
    copyFileSync(path.join(instructionsDir, file), targetDir, file);
  }

  return files;
}

/**
 * Show an interactive arrow-key menu to select the install scope.
 * Uses up/down arrows to navigate, Space or Enter to confirm.
 * Falls back to "project" scope when not running in an interactive terminal.
 * @returns {Promise<"project"|"global">}
 */
function promptScope() {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      console.log("Non-interactive environment detected, defaulting to project scope.");
      resolve("project");
      return;
    }

    const readline = require("readline");

    const options = [
      {
        value: "project",
        label: "Project level  (.claude in current directory)",
      },
      {
        value: "global",
        label: "Global level   (~/.claude for all projects)",
      },
    ];

    let cursor = 0;

    function render() {
      process.stdout.write("\n");
      process.stdout.write("  Where would you like to install?\n");
      process.stdout.write("\n");
      for (let i = 0; i < options.length; i++) {
        if (i === cursor) {
          process.stdout.write(`  \x1b[36m❯\x1b[0m ${options[i].label}\n`);
        } else {
          process.stdout.write(`    ${options[i].label}\n`);
        }
      }
      process.stdout.write("\n");
      process.stdout.write("  (Use \u2191 \u2193 to move, Space or Enter to select)\n");
    }

    function clearRender() {
      const FIXED_LINES = 5;
      const lines = options.length + FIXED_LINES;
      for (let i = 0; i < lines; i++) {
        readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout, 0);
      }
    }

    render();

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    function onData(key) {
      if (key === "\u0003") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.exit(1);
      }

      if (key === "\x1b[A") {
        cursor = (cursor - 1 + options.length) % options.length;
        clearRender();
        render();
        return;
      }

      if (key === "\x1b[B") {
        cursor = (cursor + 1) % options.length;
        clearRender();
        render();
        return;
      }

      if (key === "\r" || key === "\n" || key === " ") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
        clearRender();
        process.stdout.write(`\n  \u2714 ${options[cursor].label}\n\n`);
        resolve(options[cursor].value);
      }
    }

    process.stdin.on("data", onData);
  });
}

function scopeLabel(scope) {
  return scope === "global" ? "global (~/.claude)" : "project (.claude)";
}

/**
 * List skill directory names available in the templates folder.
 * @returns {string[]}
 */
function listAvailableSkills() {
  return fs
    .readdirSync(getSkillsDir(), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

/**
 * Skill bundles surfaced in `wizard install skills`.
 *
 * Some skills only make sense together. `sdlc-council` is the
 * orchestrator and depends on the planner, reviewer, coder, bug-fixer,
 * implementation-plan, implementation-debate, and lessons-learned
 * skills — selecting it installs the whole orchestration stack as a
 * single unit. Standalone skills are presented as their own bundles.
 *
 * @returns {{id: string, label: string, description: string, skills: string[]}[]}
 */
function getSkillBundles() {
  return [
    {
      id: "sdlc-wizard",
      label: "sdlc-wizard",
      description: "Interactive initial configuration",
      skills: ["sdlc-wizard"],
    },
    {
      id: "sdlc-council",
      label: "sdlc-council",
      description:
        "Orchestrator + planner, reviewer, coder, bug-fixer, implementation-plan, implementation-debate, lessons-learned",
      skills: [
        "sdlc-council",
        "sdlc-planner",
        "sdlc-reviewer",
        "sdlc-coder",
        "sdlc-bug-fixer",
        "sdlc-implementation-plan",
        "sdlc-implementation-debate",
        "sdlc-lessons-learned",
      ],
    },
    {
      id: "sdlc-devcontainer-setup",
      label: "sdlc-devcontainer-setup",
      description: "DevContainer setup skill",
      skills: ["sdlc-devcontainer-setup"],
    },
    {
      id: "sdlc-graphify-setup",
      label: "sdlc-graphify-setup",
      description: "Graphify knowledge-graph setup skill",
      skills: ["sdlc-graphify-setup"],
    },
  ];
}

/**
 * Show an interactive multi-select menu for choosing skill bundles to
 * install. Up/Down arrows to move the cursor, Space to toggle, Enter to
 * confirm. Falls back to selecting all bundles in non-interactive
 * environments.
 * @param {{id: string, label: string, description: string, skills: string[]}[]} bundles
 * @returns {Promise<{id: string, label: string, description: string, skills: string[]}[]>} Selected bundles
 */
function promptSkillsSelection(bundles) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      console.log(
        "Non-interactive environment detected, selecting all skill bundles."
      );
      resolve(bundles.slice());
      return;
    }

    const readline = require("readline");

    let cursor = 0;
    const checked = new Array(bundles.length).fill(false);

    function render() {
      process.stdout.write("\n");
      process.stdout.write("  Select skills to install\n");
      process.stdout.write("\n");
      for (let i = 0; i < bundles.length; i++) {
        const box = checked[i] ? "[\x1b[32mx\x1b[0m]" : "[ ]";
        const line = `${box} ${bundles[i].label}  \x1b[2m— ${bundles[i].description}\x1b[0m`;
        if (i === cursor) {
          process.stdout.write(`  \x1b[36m❯\x1b[0m ${line}\n`);
        } else {
          process.stdout.write(`    ${line}\n`);
        }
      }
      process.stdout.write("\n");
      process.stdout.write(
        "  (Use \u2191 \u2193 to move, Space to toggle, Enter to confirm)\n"
      );
    }

    function clearRender() {
      const FIXED_LINES = 5;
      const lines = bundles.length + FIXED_LINES;
      for (let i = 0; i < lines; i++) {
        readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout, 0);
      }
    }

    render();

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    function onData(key) {
      if (key === "\u0003") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.exit(1);
      }

      if (key === "\x1b[A") {
        cursor = (cursor - 1 + bundles.length) % bundles.length;
        clearRender();
        render();
        return;
      }

      if (key === "\x1b[B") {
        cursor = (cursor + 1) % bundles.length;
        clearRender();
        render();
        return;
      }

      if (key === " ") {
        checked[cursor] = !checked[cursor];
        clearRender();
        render();
        return;
      }

      if (key === "\r" || key === "\n") {
        const selected = bundles.filter((_, i) => checked[i]);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
        clearRender();
        if (selected.length === 0) {
          process.stdout.write(`\n  No skills selected. Aborting.\n\n`);
        } else {
          process.stdout.write(
            `\n  \u2714 Selected: ${selected.map((b) => b.label).join(", ")}\n\n`
          );
        }
        resolve(selected);
      }
    }

    process.stdin.on("data", onData);
  });
}

async function installCommand(cwd, scope) {
  cwd = cwd || process.cwd();
  scope = scope || "project";

  const existing = readConfig(cwd);
  const config = {
    version: VERSION,
    completedSteps: (existing && existing.completedSteps) || [],
    scope,
  };

  writeConfig(cwd, config);

  const skills = installSkills(cwd, scope);
  const instructions = installInstructions(cwd, scope);

  console.log(`\nSDLC Wizard v${VERSION} installed successfully (${scopeLabel(scope)}).`);
  console.log(
    `\nSkills installed to ${scope === "global" ? "~/.claude/skills/" : ".claude/skills/"}`
  );
  console.log(`\nInstalled skills: ${skills.join(", ")}`);
  if (instructions.length > 0) {
    console.log(
      `\nInstructions installed to ${scope === "global" ? "~/.claude/instructions/" : ".claude/instructions/"}`
    );
    console.log(`  ${instructions.join(", ")}`);
  }
  console.log(`\nNext steps:`);
  console.log(
    `  Ask your IDE chat (Copilot or Claude Code) to run the "sdlc-wizard" skill`
  );
  console.log(
    `  for initial configuration, or the "sdlc-council" skill to begin an`
  );
  console.log(`  orchestrated task with planning, coding, and review.`);
}

/**
 * Install only a user-selected subset of skill bundles.
 *
 * Shows an interactive multi-select prompt (space-toggle) over the
 * curated bundle list, then copies all skills belonging to the
 * selected bundles into `<scope>/.claude/skills/`. Does not touch
 * instructions and does not overwrite `.wizard.json` — but it does
 * record the install scope so subsequent runs are consistent.
 */
async function installSkillsCommand(cwd, scope) {
  cwd = cwd || process.cwd();
  scope = scope || "project";

  const available = listAvailableSkills();
  if (available.length === 0) {
    console.log("No skills available to install.");
    return;
  }

  const bundles = getSkillBundles().filter((bundle) =>
    bundle.skills.every((s) => available.includes(s))
  );
  if (bundles.length === 0) {
    console.log("No skill bundles available to install.");
    return;
  }

  const selectedBundles = await promptSkillsSelection(bundles);
  if (selectedBundles.length === 0) {
    return;
  }

  const selected = Array.from(
    new Set(selectedBundles.flatMap((b) => b.skills))
  );

  const existing = readConfig(cwd);
  const config = {
    version: VERSION,
    completedSteps: (existing && existing.completedSteps) || [],
    scope,
  };
  writeConfig(cwd, config);

  const installed = installSkills(cwd, scope, selected);

  console.log(
    `\nSDLC Wizard v${VERSION} skills installed (${scopeLabel(scope)}).`
  );
  console.log(
    `\nSkills installed to ${scope === "global" ? "~/.claude/skills/" : ".claude/skills/"}`
  );
  console.log(`\nSelected bundles: ${selectedBundles.map((b) => b.label).join(", ")}`);
  console.log(`Installed skills: ${installed.join(", ")}`);
}

module.exports = {
  installCommand,
  installSkills,
  installInstructions,
  installSkillsCommand,
  promptScope,
  promptSkillsSelection,
  listAvailableSkills,
  getSkillBundles,
};
