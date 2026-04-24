# Complex Task Prompt — Wizard Lifecycle Management

Use this as a standalone prompt for a planning or implementation task.

Add installation lifecycle management to the `agentic-sdlc-wizard` project.

**Goal:** The CLI currently installs files but does not track them as a
managed set. Expand it so an existing installation can be inspected,
updated, and safely removed over time. The new design should introduce a
manifest-backed model for installed files, automatically migrate existing
`.wizard.json` files created by the current release, and expose user-facing
commands that make lifecycle operations safe by default.

**Acceptance criteria:**

1. Introduce a manifest-oriented config model in `.wizard.json` that retains
   the current fields (`version`, `scope`, `completedSteps`) and adds enough
   data to track every managed file written by the wizard. At minimum, the
   manifest must capture step ownership, destination path, template source,
   and the content hash that was written at install/update time.
2. Existing `.wizard.json` files from the current release must continue to
   work. If the new manifest data is missing, the CLI should reconstruct it
   from the installed steps and current templates, then persist the upgraded
   config without requiring the user to reinstall.
3. Refactor the current install flow so there is one reusable source of truth
   for "which files belong to which step and where they should be installed."
   `wizard install`, `wizard install fantastic4`, the new status/update/
   uninstall commands, and manifest reconstruction must all rely on that same
   inventory logic instead of duplicating copy rules.
4. Add a `wizard status` command that exits with a clear error when
   `.wizard.json` is missing, reads the install scope and completed steps,
   and reports a human-readable summary of managed files grouped into useful
   states such as unchanged, missing, modified locally, and out of date with
   the packaged template version. Add a machine-readable `--json` mode for
   the same information.
5. Add a `wizard update` command that can refresh all installed steps or a
   single step (for example `wizard update fantastic4`). It must support
   `--dry-run` and `--force`. By default it should warn and skip locally
   modified files; with `--force` it may overwrite them. After a successful
   update, the manifest hashes and the top-level config version must reflect
   the current CLI package version.
6. Add a `wizard uninstall` command that can remove one installed step or the
   entire wizard footprint. It must remove only wizard-managed files, prune
   empty directories created by the wizard when safe, respect `--dry-run`,
   and avoid deleting locally modified files unless the user explicitly
   confirms or passes `--force`.
7. Any interactive confirmation used by `update` or `uninstall` must follow
   the same TTY-detection pattern used by `promptScope()` in
   `src/commands/install.js`. In non-interactive environments, the safe
   default is to warn and skip. In interactive TTY mode, the prompt should be
   explicit about what will be overwritten or removed.
8. Register the new commands in `src/cli.js`, update CLI help text, and keep
   the command style consistent with the existing `install` flow.
9. Preserve the repository's current install contract: the wizard still
   installs a single `.claude/` tree, does not create `.github/` artifacts,
   and does not remove files it does not own.
10. Add thorough unit test coverage in `test/` for the new manifest helpers,
    config migration, status reporting, update behavior, uninstall behavior,
    CLI argument routing, dry-run semantics, force semantics, and TTY/non-TTY
    safety behavior. Existing tests should keep passing unless they need an
    intentional update to reflect documented new behavior.
11. Update the README so the new lifecycle commands, safety guarantees, and
    `.wizard.json` manifest behavior are documented for both project and
    global installs.

**Constraints:**

- Do not introduce new runtime npm dependencies; use only Node.js built-ins
  (`fs`, `crypto`, `path`, `readline`) and what is already in `package.json`.
- Keep the implementation compatible with the current repository layout and
  template directory structure under `templates/`.
- The `--force` flag must remain opt-in; the default behavior is conservative
  and should prefer warning/skipping over destructive changes.
- Do not rely on git metadata to determine whether a file was locally modified;
  use the manifest and current file contents only.
- The manifest should track only files the wizard manages. Unknown user files
  under `.claude/` or `~/.claude/` must be left untouched.
- The solution should be structured so future install steps can register their
  owned files without rewriting each lifecycle command.
