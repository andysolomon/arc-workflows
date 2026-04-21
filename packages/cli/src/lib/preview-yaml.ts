import { generate, type Workflow } from '@arc-workflows/core';

/**
 * Generate a YAML preview from a partially-constructed Workflow.
 *
 * Fills in empty defaults for missing `on` and `jobs` fields so
 * core's strict `generate()` accepts the input. Returns a comment
 * string on error.
 */
export function previewYaml(partial: Partial<Workflow>): string {
  try {
    const filled = {
      ...partial,
      on: partial.on ?? {},
      jobs: partial.jobs ?? {},
    } as Workflow;
    return generate(filled);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `# (preview unavailable)\n# ${msg}`;
  }
}
