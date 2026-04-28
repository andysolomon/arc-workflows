# arc-workflows

An interactive CLI wizard for creating GitHub Actions workflows with confidence.

Pick a template, answer a few prompts, and walk away with a validated, commented `.yml` file in `.github/workflows/`. No more copy-pasting from someone else's repo.

## Install

```sh
npm install -g arc-workflows
# or run once without installing:
npx arc-workflows
```

## Commands

| Command                                   | Description                                                                              | Example                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `arc-workflows` or `arc-workflows create` | Launch the interactive wizard.                                                           | `arc-workflows create --template ci-node`                    |
| `arc-workflows edit <file>`               | Open an existing workflow YAML file in the wizard. Saves back to the same path on exit.  | `arc-workflows edit .github/workflows/ci.yml`                |
| `arc-workflows validate <file>`           | Validate an existing workflow YAML file. Exit `0` valid, `1` invalid, `2` parse error.   | `arc-workflows validate .github/workflows/ci.yml`            |
| `arc-workflows list-templates`            | List the 10 built-in templates.                                                          | `arc-workflows list-templates`                               |
| `arc-workflows generate <file>`           | Generate YAML from a workflow JSON file. Prints to stdout by default; use `-o` to write. | `arc-workflows generate wf.json -o .github/workflows/ci.yml` |
| `arc-workflows --version`                 | Print the installed version.                                                             | `arc-workflows --version`                                    |
| `arc-workflows --help`                    | Show help.                                                                               | `arc-workflows --help`                                       |

## Create flags

- `--template <id>` — pre-load a template so the wizard skips the template-picker page. Run `arc-workflows list-templates` to see the available ids.

## Editing existing workflows

`arc-workflows edit <file>` parses the YAML, hydrates the wizard with the loaded workflow, and lands you on the **jobs** page so you can add, edit, or remove jobs and steps. On confirm, the file is rewritten in place at the same path (you can change the path on the review page).

The behavior of the saved workflow is identical to the input, but **formatting is normalized**:

- **Comments are stripped.** Leading and inline `# …` comments are not preserved across the round-trip. Keep important context in `name:` fields, step names, or commit messages instead.
- **Key order is canonical.** Top-level and per-job keys are reordered into the canonical sequence (`name → on → jobs`, `runs-on → needs → if → strategy → steps`, etc.).
- **Trigger shorthand expands.** `on: push` and `on: [push, pull_request]` become the equivalent object form (`on: { push: {} }`).
- **Quoting and indentation may change** to match the generator's defaults (two-space indent, double-quoted strings where required).

If you rely on a specific layout, edit the file by hand. Otherwise, the wizard is the safer path: every save round-trips through the same validator as `arc-workflows validate`.

## Keyboard shortcuts (wizard)

| Key       | Action                               |
| --------- | ------------------------------------ |
| `↑` / `↓` | Move selection                       |
| `Tab`     | Cycle focus between fields / buttons |
| `Enter`   | Confirm / next page                  |
| `Esc`     | Back to previous page                |
| `Ctrl+C`  | Cancel and exit (exit code 130)      |

## What the wizard builds

The wizard walks you through: **template → name → triggers → jobs → steps → review**, then writes a valid GitHub Actions workflow:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
```

Every generated file passes the same validator as `arc-workflows validate`.

## Exit codes

| Code  | Meaning                                         |
| ----- | ----------------------------------------------- |
| `0`   | Success                                         |
| `1`   | Validation errors (for `validate` / `generate`) |
| `2`   | Unexpected error (parse failure, IO, etc.)      |
| `130` | User cancelled (Ctrl+C)                         |

## Programmatic API

For programmatic use (validate, generate, read templates), use [`@arc-workflows/core`](../core).

## License

ISC
