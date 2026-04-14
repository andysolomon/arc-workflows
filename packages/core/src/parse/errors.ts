/**
 * Thrown by {@link parse} when the input string is not valid YAML or
 * cannot be interpreted as a GitHub Actions workflow.
 */
export class ParseError extends Error {
  constructor(
    message: string,
    /** The raw YAML string that could not be parsed. */
    public readonly source?: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ParseError';
  }
}
