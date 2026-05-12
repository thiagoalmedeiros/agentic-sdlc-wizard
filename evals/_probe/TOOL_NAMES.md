# Canonical Tool Names for copilot-sdk Executor

<!-- tool-names LOCKED — do not edit without re-running all 5 probes -->

Captured via `waza new task from-prompt` + `gpt-5-mini`, 2025-05-12.

## Mapping: VS Code name → copilot-sdk emitter

| VS Code / description         | copilot-sdk `tool` name | Notes                                                 |
| ----------------------------- | ----------------------- | ----------------------------------------------------- |
| `run_in_terminal`             | `bash`                  | Shell commands, `command_pattern` on the shell string |
| `create_file`                 | `create`                | `path_pattern` on file path                           |
| `read_file`                   | `view`                  | `path_pattern` on file path                           |
| `file_search` / `grep_search` | `glob`                  | `path_pattern` on search root                         |
| skill invocation              | `skill`                 | `skill_pattern` on skill name                         |
| `fetch_webpage`               | `web_fetch`             | No `path_pattern` field (URL arg)                     |

## Usage in eval graders

```yaml
graders:
  - name: uses-bash
    type: behavior
    config:
      required_tools: [bash] # CORRECT ✓
      # NOT: run_in_terminal        # WRONG  ✗

  - name: no-create
    type: behavior
    config:
      forbidden_tools: [create] # CORRECT ✓
      # NOT: create_file            # WRONG  ✗
```

## Probe source files

- `probe-bash.yaml` — tool: `bash`
- `probe-create.yaml` — tool: `create`
- `probe-edit.yaml` — tool: `view`, `glob`
- `probe-skill.yaml` — tool: `skill`
- `probe-web.yaml` — tool: `web_fetch`
