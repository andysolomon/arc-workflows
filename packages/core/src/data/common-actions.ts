/**
 * A curated registry of popular GitHub Actions with their known input
 * schemas. Used by the web app's step configurator and the (future)
 * CLI wizard's action picker to power autocomplete.
 *
 * Not exhaustive — covers the most-common actions. PRs welcome for
 * additions.
 */

export interface CommonActionInput {
  /** Input name as it appears in `with:` */
  name: string;
  /** Brief description shown in tooltips */
  description: string;
  /** Whether the input is required */
  required?: boolean;
  /** Default value if any */
  default?: string;
  /** For enum-like inputs, the valid options */
  options?: string[];
}

export interface CommonAction {
  /** Action reference like `actions/checkout` */
  name: string;
  /** Default version like `v4` */
  version: string;
  /** One-line description */
  description: string;
  /** Tags for search/filter */
  tags: string[];
  /** Known inputs */
  inputs: CommonActionInput[];
}

export const COMMON_ACTIONS: readonly CommonAction[] = [
  {
    name: 'actions/checkout',
    version: 'v4',
    description: 'Check out a Git repository at a particular version',
    tags: ['git', 'core'],
    inputs: [
      { name: 'ref', description: 'Branch, tag, or SHA to check out' },
      {
        name: 'fetch-depth',
        description: 'Number of commits to fetch (0 for all history)',
        default: '1',
      },
      { name: 'token', description: 'Personal access token for private repos' },
      {
        name: 'submodules',
        description: 'Whether to check out submodules',
        options: ['true', 'false', 'recursive'],
      },
    ],
  },
  {
    name: 'actions/setup-node',
    version: 'v4',
    description: 'Set up a Node.js environment',
    tags: ['node', 'javascript', 'language'],
    inputs: [
      {
        name: 'node-version',
        description: 'Node.js version to install (e.g. 20, lts/*)',
        required: true,
      },
      {
        name: 'cache',
        description: 'Package manager to cache for',
        options: ['npm', 'pnpm', 'yarn'],
      },
      { name: 'registry-url', description: 'Optional registry URL for npm publish' },
    ],
  },
  {
    name: 'actions/setup-python',
    version: 'v5',
    description: 'Set up a Python environment',
    tags: ['python', 'language'],
    inputs: [
      { name: 'python-version', description: 'Python version (e.g. 3.12, 3.x)', required: true },
      {
        name: 'cache',
        description: 'Package manager to cache for',
        options: ['pip', 'pipenv', 'poetry'],
      },
    ],
  },
  {
    name: 'actions/setup-go',
    version: 'v5',
    description: 'Set up a Go environment',
    tags: ['go', 'language'],
    inputs: [
      { name: 'go-version', description: 'Go version (e.g. 1.22, stable)', required: true },
      { name: 'cache', description: 'Whether to cache go modules', default: 'true' },
    ],
  },
  {
    name: 'actions/setup-java',
    version: 'v4',
    description: 'Set up a Java JDK environment',
    tags: ['java', 'jvm', 'language'],
    inputs: [
      { name: 'java-version', description: 'Java version (e.g. 21)', required: true },
      {
        name: 'distribution',
        description: 'JDK distribution',
        required: true,
        options: ['temurin', 'zulu', 'corretto', 'microsoft', 'liberica', 'oracle'],
      },
      { name: 'cache', description: 'Build tool to cache for', options: ['maven', 'gradle', 'sbt'] },
    ],
  },
  {
    name: 'actions/cache',
    version: 'v4',
    description: 'Cache dependencies and build outputs',
    tags: ['cache', 'core'],
    inputs: [
      { name: 'path', description: 'Files or directories to cache', required: true },
      { name: 'key', description: 'Explicit cache key', required: true },
      { name: 'restore-keys', description: 'Ordered list of fallback keys' },
    ],
  },
  {
    name: 'actions/upload-artifact',
    version: 'v4',
    description: 'Upload an artifact to share between jobs',
    tags: ['artifact', 'core'],
    inputs: [
      { name: 'name', description: 'Artifact name', default: 'artifact' },
      { name: 'path', description: 'Files or directories to upload', required: true },
      { name: 'retention-days', description: 'Days to keep the artifact', default: '90' },
    ],
  },
  {
    name: 'actions/download-artifact',
    version: 'v4',
    description: 'Download an artifact uploaded earlier',
    tags: ['artifact', 'core'],
    inputs: [
      { name: 'name', description: 'Artifact name to download' },
      { name: 'path', description: 'Destination directory' },
    ],
  },
  {
    name: 'actions/github-script',
    version: 'v7',
    description: 'Run JavaScript snippets that use the GitHub API client',
    tags: ['github', 'scripting'],
    inputs: [
      { name: 'script', description: 'JavaScript snippet to execute', required: true },
      { name: 'github-token', description: 'GitHub token used by the client' },
    ],
  },
  {
    name: 'docker/setup-buildx-action',
    version: 'v3',
    description: 'Set up Docker Buildx for multi-platform builds',
    tags: ['docker', 'build'],
    inputs: [
      { name: 'driver', description: 'Buildx driver', default: 'docker-container' },
      { name: 'install', description: 'Install buildx as the default builder', default: 'false' },
    ],
  },
  {
    name: 'docker/setup-qemu-action',
    version: 'v3',
    description: 'Set up QEMU for cross-platform Docker builds',
    tags: ['docker', 'build'],
    inputs: [
      { name: 'platforms', description: 'Comma-separated list of platforms', default: 'all' },
    ],
  },
  {
    name: 'docker/login-action',
    version: 'v3',
    description: 'Log in to a Docker registry',
    tags: ['docker', 'auth'],
    inputs: [
      { name: 'registry', description: 'Registry hostname (omit for Docker Hub)' },
      { name: 'username', description: 'Registry username', required: true },
      { name: 'password', description: 'Registry password or token', required: true },
    ],
  },
  {
    name: 'docker/build-push-action',
    version: 'v6',
    description: 'Build and (optionally) push a Docker image',
    tags: ['docker', 'build'],
    inputs: [
      { name: 'context', description: 'Build context path', default: '.' },
      { name: 'push', description: 'Push the image after building', default: 'false' },
      { name: 'tags', description: 'Comma- or newline-separated list of image tags' },
      { name: 'platforms', description: 'Target platforms (e.g. linux/amd64,linux/arm64)' },
      { name: 'cache-from', description: 'External cache sources' },
      { name: 'cache-to', description: 'External cache destinations' },
    ],
  },
  {
    name: 'docker/metadata-action',
    version: 'v5',
    description: 'Extract metadata (tags, labels) for Docker images',
    tags: ['docker', 'metadata'],
    inputs: [
      { name: 'images', description: 'Image names', required: true },
      { name: 'tags', description: 'Tag generation rules' },
    ],
  },
  {
    name: 'aws-actions/configure-aws-credentials',
    version: 'v4',
    description: 'Configure AWS credentials for use in subsequent steps',
    tags: ['aws', 'auth', 'cloud'],
    inputs: [
      { name: 'aws-region', description: 'AWS region', required: true },
      { name: 'role-to-assume', description: 'IAM role ARN to assume via OIDC' },
      { name: 'aws-access-key-id', description: 'Access key id (avoid; prefer OIDC)' },
      { name: 'aws-secret-access-key', description: 'Secret access key (avoid; prefer OIDC)' },
    ],
  },
  {
    name: 'aws-actions/amazon-ecr-login',
    version: 'v2',
    description: 'Log in to Amazon ECR',
    tags: ['aws', 'docker', 'auth'],
    inputs: [
      { name: 'registries', description: 'Comma-separated list of ECR registry IDs' },
    ],
  },
  {
    name: 'peaceiris/actions-gh-pages',
    version: 'v4',
    description: 'Deploy a static site to GitHub Pages',
    tags: ['github-pages', 'deploy'],
    inputs: [
      { name: 'github_token', description: 'GitHub token for pushing', required: true },
      { name: 'publish_dir', description: 'Directory to publish', required: true },
      { name: 'publish_branch', description: 'Branch to publish to', default: 'gh-pages' },
    ],
  },
  {
    name: 'softprops/action-gh-release',
    version: 'v2',
    description: 'Create a GitHub Release',
    tags: ['release', 'github'],
    inputs: [
      { name: 'files', description: 'Newline-separated list of release assets' },
      { name: 'tag_name', description: 'Tag to release against' },
      { name: 'name', description: 'Release name' },
      { name: 'draft', description: 'Create as draft', default: 'false' },
    ],
  },
  {
    name: 'actions/create-release',
    version: 'v1',
    description: 'Create a GitHub Release (legacy)',
    tags: ['release', 'github'],
    inputs: [
      { name: 'tag_name', description: 'Tag to release against', required: true },
      { name: 'release_name', description: 'Release name', required: true },
    ],
  },
  {
    name: 'hashicorp/setup-terraform',
    version: 'v3',
    description: 'Set up the Terraform CLI',
    tags: ['terraform', 'iac'],
    inputs: [
      { name: 'terraform_version', description: 'Terraform version (e.g. 1.9.0)' },
      { name: 'terraform_wrapper', description: 'Install wrapper script', default: 'true' },
    ],
  },
  {
    name: 'codecov/codecov-action',
    version: 'v4',
    description: 'Upload coverage reports to Codecov',
    tags: ['coverage', 'testing'],
    inputs: [
      { name: 'files', description: 'Comma-separated list of coverage files' },
      { name: 'token', description: 'Codecov upload token' },
      { name: 'flags', description: 'Coverage flags' },
    ],
  },
  {
    name: 'pnpm/action-setup',
    version: 'v4',
    description: 'Install pnpm package manager',
    tags: ['node', 'pnpm', 'language'],
    inputs: [
      { name: 'version', description: 'pnpm version to install' },
      { name: 'run_install', description: 'Whether to run install after setup', default: 'null' },
    ],
  },
  {
    name: 'ruby/setup-ruby',
    version: 'v1',
    description: 'Set up a Ruby environment',
    tags: ['ruby', 'language'],
    inputs: [
      { name: 'ruby-version', description: 'Ruby version (e.g. 3.3)', required: true },
      { name: 'bundler-cache', description: 'Run bundle install and cache gems', default: 'false' },
    ],
  },
];

/** Look up a common action by full reference. */
export function findActionByName(name: string): CommonAction | undefined {
  return COMMON_ACTIONS.find((a) => a.name === name);
}
