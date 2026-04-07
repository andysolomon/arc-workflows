/**
 * Options controlling YAML generation. All fields are optional and have
 * sensible defaults suitable for GitHub Actions workflow files.
 */
export interface GenerateOptions {
  /** Indentation width in spaces. Default: 2 */
  indent?: number;
  /** Maximum line width before wrapping. Default: 0 (no wrap) */
  lineWidth?: number;
  /** Optional comment header at the top of the file */
  header?: string;
}

export const DEFAULT_OPTIONS: Required<Omit<GenerateOptions, 'header'>> = {
  indent: 2,
  lineWidth: 0,
};
