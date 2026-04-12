You are a DevOps and developer-experience expert. Set up or review a `.devcontainer` environment for this project.

The environment must be **polyglot-ready**: the base image should come from the official Microsoft devcontainers registry (`mcr.microsoft.com/devcontainers/`) so it ships with the standard non-root user, git integration, and VS Code server support already configured. Choose the variant that best matches the project's primary runtime (e.g., `base:ubuntu`, `javascript-node`, `python`, `universal`, etc.), but do **not** hard-code a specific language image as an example — infer it from the project context.

---

## Mode detection

Before doing anything else, determine whether the project already has a `.devcontainer` directory:

- If `.devcontainer/` **does not exist** → follow the **New setup** flow below
- If `.devcontainer/` **exists** → follow the **Audit existing configuration** flow below

---

## Prerequisites — verify before doing anything else (both flows)

Before creating or modifying any files, check that Docker is installed and the daemon is running:

1. Run `docker info` in the terminal
2. If the command **fails** or Docker is not found:
   - Stop immediately
   - Inform the user that Docker must be installed and running before proceeding
   - Provide a link to the official install page: https://docs.docker.com/get-docker/
   - Do **not** create any `.devcontainer` files
3. If the command **succeeds**, proceed with creating the files below

---

## New setup flow

When `.devcontainer/` does not exist, create the following three files.

### Files to create

### `.devcontainer/devcontainer.json`

```jsonc
{
  "name": "<project-name> devcontainer",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspaces/${localWorkspaceFolderBasename}",
  "customizations": {
    "vscode": {
      "settings": {
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
          // add language-appropriate fix-all actions, e.g. eslint, ruff, etc.
        }
      },
      "extensions": [
        // linter, formatter, language support, test runner extensions for the project's stack
      ]
    }
  },
  "forwardPorts": [/* infer relevant ports from the project */],
  "mounts": [
    // Always mount SSH keys and gitconfig from the host so git operations work seamlessly
    "source=${localEnv:HOME}/.ssh,target=/home/<remoteUser>/.ssh,type=bind,consistency=cached",
    "source=${localEnv:HOME}/.gitconfig,target=/home/<remoteUser>/.gitconfig,type=bind,consistency=cached"
  ],
  "remoteUser": "<non-root user provided by the base image, e.g. node, vscode, etc.>"
}
```

**Rules:**
- Always use `dockerComposeFile` + `service` to reference the compose file — never use `build.dockerfile` directly; this makes it easy to add services (databases, caches, etc.) later without restructuring
- `workspaceFolder` must point to `/workspaces/${localWorkspaceFolderBasename}` to align with the volume mount defined in `docker-compose.yml`
- `forwardPorts` must list ports the app actually exposes (dev server, API, DB, etc.)
- `mounts` must always include SSH keys and `.gitconfig` so the developer can push/pull and sign commits from inside the container
- `remoteUser` must match the non-root user that ships with the chosen Microsoft devcontainers base image
- Only add `postCreateCommand` for steps that must run after the workspace is mounted (e.g., `npm install`, `pip install -e .`); do not use it for tooling that belongs in the Dockerfile

---

### `.devcontainer/docker-compose.yml`

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      # Mount the workspace root into the container
      - ..:/workspaces/${localWorkspaceFolderBasename}:cached
    # Keep the container running so VS Code can attach to it
    command: sleep infinity
    # Uncomment and add extra services (postgres, redis, etc.) as needed
```

**Rules:**
- The service name must match the `service` field in `devcontainer.json` (default: `app`)
- The workspace volume must use `..` as the source (one level up from `.devcontainer/`) and mount to `/workspaces/${localWorkspaceFolderBasename}`
- `command: sleep infinity` keeps the container alive for VS Code to attach; do not use an application start command here
- Additional services (databases, message brokers, etc.) can be added as sibling services under `services:` when the project requires them

---

### `.devcontainer/Dockerfile`

```dockerfile
FROM mcr.microsoft.com/devcontainers/<variant>:<tag>

# Install all global development tools here so the container is self-contained.
# Examples: package managers, CLI tools, task runners, linters, formatters.
# Combine RUN steps and clean up package manager caches to keep the image lean.

# Example pattern (adapt to the project stack):
# RUN apt-get update && apt-get install -y --no-install-recommends <system-deps> \
#     && rm -rf /var/lib/apt/lists/*

# RUN <runtime-package-manager> install -g <tool1> <tool2> ...

# Install a task runner (e.g., Taskfile) when the project uses one:
# RUN sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin
```

**Rules:**
- **All tooling must be installed in the Dockerfile** — the image must be fully usable immediately after build, without relying on any post-create scripts for tools
- Do **not** install project dependencies (lock-file packages) in the Dockerfile; those belong in `postCreateCommand`
- Prefer explicit, pinned versions for critical tools to ensure reproducible builds
- Combine `RUN` instructions, avoid unnecessary packages, and remove caches to minimise image size
- The non-root user and `WORKDIR` are already handled by the Microsoft base image; only override them if there is a specific reason

---

## General guidelines

- Keep the `.devcontainer` folder minimal: `devcontainer.json` + `docker-compose.yml` + `Dockerfile` are the three required files — no more, unless the project demands it
- Infer the correct base image variant, ports, extensions, and tooling from the project's language, framework, and existing config files (e.g., `package.json`, `pyproject.toml`, `Taskfile.yml`, `angular.json`)
- Always include the SSH and gitconfig mounts — they are essential for a good developer experience
- Add brief inline comments in the Dockerfile explaining non-obvious installation steps

---

## Post-creation verification

After all three files have been created or modified, **dispatch a subagent** to validate the setup:

1. `cd` into the project root (the parent of `.devcontainer/`)
2. Run `docker compose -f .devcontainer/docker-compose.yml build` and verify the image builds without errors
3. Run `docker compose -f .devcontainer/docker-compose.yml up -d` and verify the container starts successfully
4. Run `docker compose -f .devcontainer/docker-compose.yml ps` and confirm the `app` service is in a **running** state
5. Run `docker compose -f .devcontainer/docker-compose.yml down` to clean up after the test

If any step fails:
- Read the error output carefully
- Fix the relevant file (Dockerfile, docker-compose.yml, or devcontainer.json)
- Re-run the verification from step 1

Only report success to the user once the container has been built, started, confirmed running, and cleaned up without errors.

---

## Audit existing configuration flow

When `.devcontainer/` already exists, review the configuration against the standards above instead of creating files from scratch.

### Step A1 — Read existing files

Read all files inside `.devcontainer/` (at minimum look for `devcontainer.json`, `docker-compose.yml`, and `Dockerfile`).

### Step A2 — Audit checklist

Compare each file against the rules defined in the **New setup flow** section above. Use the following checklist:

#### devcontainer.json

| # | Check | Standard |
|---|-------|----------|
| 1 | Uses `dockerComposeFile` + `service` | Must reference a compose file — never use `build.dockerfile` directly |
| 2 | `workspaceFolder` value | Must be `/workspaces/${localWorkspaceFolderBasename}` |
| 3 | SSH key mount present | Must mount `${localEnv:HOME}/.ssh` into the container |
| 4 | `.gitconfig` mount present | Must mount `${localEnv:HOME}/.gitconfig` into the container |
| 5 | `remoteUser` set | Must match the non-root user from the Microsoft base image |
| 6 | `forwardPorts` populated | Must list all ports the app actually exposes |
| 7 | VS Code extensions listed | Should include linter, formatter, language support, and test runner extensions for the stack |
| 8 | `editor.formatOnSave` enabled | Recommended in `customizations.vscode.settings` |
| 9 | `postCreateCommand` usage | Should only install project dependencies, not global tooling |

#### docker-compose.yml

| # | Check | Standard |
|---|-------|----------|
| 10 | Service name matches `service` field | Default: `app` — must be consistent with `devcontainer.json` |
| 11 | Workspace volume source | Must use `..` (one level up from `.devcontainer/`) |
| 12 | Workspace volume target | Must mount to `/workspaces/${localWorkspaceFolderBasename}` |
| 13 | `command: sleep infinity` | Must be present to keep the container alive |

#### Dockerfile

| # | Check | Standard |
|---|-------|----------|
| 14 | Base image source | Must be from `mcr.microsoft.com/devcontainers/` and match the project stack |
| 15 | Global tooling in Dockerfile | All global tools must be installed here, not in post-create scripts |
| 16 | No project dependencies | Lock-file packages (`npm install`, `pip install`) must **not** be in the Dockerfile |
| 17 | `RUN` instructions combined | Combine steps and clean up caches to minimize image size |
| 18 | Tool versions pinned | Critical tools should use explicit, pinned versions |

### Step A3 — Present findings

Present the audit results as a numbered list of suggestions grouped by file:
- For each issue found, state the check number, what the current value/pattern is, what the standard requires, and the specific change proposed
- Use ⚠️ for issues that should be fixed and ℹ️ for optional improvements
- If a file passes all checks, mark it with ✅

### Step A4 — Interactive selection

Ask the user: "Which suggestions would you like me to implement? (enter the numbers separated by commas, 'all' for everything, or 'none' to skip)"

### Step A5 — Apply selected changes

If the user selected suggestions:
1. Modify **only** the parts of the existing files that correspond to the selected suggestions
2. Preserve all configuration that was not flagged — do **not** rewrite files from scratch
3. After applying changes, proceed to **Post-creation verification** above

If the user selected "none", skip verification and proceed to mark the step as done.
