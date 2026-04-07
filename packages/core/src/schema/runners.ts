/**
 * Runner labels for the `runs-on` field of a job.
 *
 * Reference: https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job
 *
 * GitHub-hosted runners have well-known labels (`ubuntu-latest`,
 * `ubuntu-24.04`, `macos-14`, etc.) but self-hosted runners can use
 * arbitrary user-defined labels. We model this with the
 * `KnownRunner | (string & {})` idiom: TypeScript's IDE will autocomplete
 * the known literal labels but still accept any other string at the type
 * level.
 *
 * The `(string & {})` trick: `string & {}` is structurally identical to
 * `string`, but TypeScript treats it as a *distinct* type for the purpose
 * of literal-vs-string union widening. Without this trick, the union
 * `'ubuntu-latest' | string` collapses to just `string` and IDE
 * autocomplete is lost.
 *
 * See: https://github.com/microsoft/TypeScript/issues/29729
 */

/**
 * GitHub-hosted runner labels current as of 2026-04. Update this list
 * when GitHub publishes new labels via a `feat:` PR.
 */
export type KnownRunner =
  // Ubuntu — latest tracks the most recent stable image
  | 'ubuntu-latest'
  | 'ubuntu-24.04'
  | 'ubuntu-22.04'
  | 'ubuntu-24.04-arm'
  | 'ubuntu-22.04-arm'
  // Windows
  | 'windows-latest'
  | 'windows-2022'
  | 'windows-2025'
  | 'windows-11-arm'
  // macOS — Intel and Apple Silicon
  | 'macos-latest'
  | 'macos-15'
  | 'macos-14'
  | 'macos-13';

/**
 * Any runner label. Accepts the well-known GH-hosted labels (with IDE
 * autocomplete) and arbitrary self-hosted labels.
 */
export type Runner = KnownRunner | (string & {});

/**
 * The `runs-on` field of a job. Accepts:
 *
 *  - A single label (`'ubuntu-latest'`)
 *  - An array of labels for self-hosted runners with multiple criteria
 *    (`['self-hosted', 'linux', 'x64']`)
 *  - A `{ group, labels }` object for runner group selection
 */
export type RunsOn =
  | Runner
  | Runner[]
  | {
      group?: string;
      labels?: string | string[];
    };
