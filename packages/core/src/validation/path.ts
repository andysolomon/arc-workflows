/**
 * Format a structured path as a human-readable dot/bracket string.
 *
 * String segments use dot notation; numeric segments use bracket
 * notation. The first segment never gets a leading dot.
 *
 * @example
 * formatPath([]);                                         // ""
 * formatPath(['jobs']);                                   // "jobs"
 * formatPath(['jobs', 'build']);                          // "jobs.build"
 * formatPath(['jobs', 'build', 'steps', 2, 'uses']);      // "jobs.build.steps[2].uses"
 */
export function formatPath(segments: (string | number)[]): string {
  let out = '';
  for (const segment of segments) {
    if (typeof segment === 'number') {
      out += `[${String(segment)}]`;
    } else if (out === '') {
      out = segment;
    } else {
      out += `.${segment}`;
    }
  }
  return out;
}
