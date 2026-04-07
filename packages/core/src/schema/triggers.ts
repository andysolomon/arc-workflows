/**
 * Workflow trigger event configurations.
 *
 * Reference: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows
 *
 * GitHub Actions allows several syntactic forms for the `on:` field
 * (bare string, array of strings, or full object). Our schema only
 * accepts the canonical object form. The parser (Phase 2.5) is
 * responsible for normalizing the shorthand variants on the way in.
 *
 * Scope: this file types the **15 most-used trigger events** with full
 * field-level configuration. Less common events are accepted via
 * `OtherTriggerConfig` so workflows can still reference them, just
 * without IDE autocomplete on their fields. Track full coverage as a
 * follow-up.
 */

// ── shared filter shapes ────────────────────────────────────────────────

/**
 * Branch / tag / path filters used by `push` and `pull_request`.
 *
 * Reference: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#filter-pattern-cheat-sheet
 */
export interface BranchTagPathFilters {
  branches?: string[];
  'branches-ignore'?: string[];
  tags?: string[];
  'tags-ignore'?: string[];
  paths?: string[];
  'paths-ignore'?: string[];
}

// ── push / pull_request / pull_request_target ──────────────────────────

export type PushConfig = BranchTagPathFilters;

export type PullRequestActivity =
  | 'assigned'
  | 'unassigned'
  | 'labeled'
  | 'unlabeled'
  | 'opened'
  | 'edited'
  | 'closed'
  | 'reopened'
  | 'synchronize'
  | 'converted_to_draft'
  | 'ready_for_review'
  | 'locked'
  | 'unlocked'
  | 'review_requested'
  | 'review_request_removed'
  | 'auto_merge_enabled'
  | 'auto_merge_disabled'
  | 'enqueued'
  | 'dequeued'
  | 'milestoned'
  | 'demilestoned';

export interface PullRequestConfig extends BranchTagPathFilters {
  types?: PullRequestActivity[];
}

export type PullRequestTargetConfig = PullRequestConfig;

// ── schedule ───────────────────────────────────────────────────────────

export interface ScheduleConfig {
  cron: string;
}

// ── workflow_dispatch ──────────────────────────────────────────────────

interface WorkflowDispatchInputBase {
  description?: string;
  required?: boolean;
}

export interface WorkflowDispatchStringInput extends WorkflowDispatchInputBase {
  type: 'string';
  default?: string;
}

export interface WorkflowDispatchNumberInput extends WorkflowDispatchInputBase {
  type: 'number';
  default?: number;
}

export interface WorkflowDispatchBooleanInput extends WorkflowDispatchInputBase {
  type: 'boolean';
  default?: boolean;
}

export interface WorkflowDispatchChoiceInput extends WorkflowDispatchInputBase {
  type: 'choice';
  options: string[];
  default?: string;
}

export interface WorkflowDispatchEnvironmentInput extends WorkflowDispatchInputBase {
  type: 'environment';
  default?: string;
}

export type WorkflowDispatchInput =
  | WorkflowDispatchStringInput
  | WorkflowDispatchNumberInput
  | WorkflowDispatchBooleanInput
  | WorkflowDispatchChoiceInput
  | WorkflowDispatchEnvironmentInput;

export interface WorkflowDispatchConfig {
  inputs?: Record<string, WorkflowDispatchInput>;
}

// ── workflow_call ──────────────────────────────────────────────────────

export interface WorkflowCallInput {
  description?: string;
  required?: boolean;
  type: 'string' | 'number' | 'boolean';
  default?: string | number | boolean;
}

export interface WorkflowCallOutput {
  description?: string;
  value: string;
}

export interface WorkflowCallSecret {
  description?: string;
  required?: boolean;
}

export interface WorkflowCallConfig {
  inputs?: Record<string, WorkflowCallInput>;
  outputs?: Record<string, WorkflowCallOutput>;
  secrets?: Record<string, WorkflowCallSecret>;
}

// ── workflow_run ───────────────────────────────────────────────────────

export interface WorkflowRunConfig {
  workflows: string[];
  types?: ('completed' | 'requested' | 'in_progress')[];
  branches?: string[];
  'branches-ignore'?: string[];
}

// ── release ────────────────────────────────────────────────────────────

export type ReleaseActivity =
  | 'published'
  | 'unpublished'
  | 'created'
  | 'edited'
  | 'deleted'
  | 'prereleased'
  | 'released';

export interface ReleaseConfig {
  types?: ReleaseActivity[];
}

// ── issues / issue_comment ─────────────────────────────────────────────

export type IssuesActivity =
  | 'opened'
  | 'edited'
  | 'deleted'
  | 'transferred'
  | 'pinned'
  | 'unpinned'
  | 'closed'
  | 'reopened'
  | 'assigned'
  | 'unassigned'
  | 'labeled'
  | 'unlabeled'
  | 'locked'
  | 'unlocked'
  | 'milestoned'
  | 'demilestoned';

export interface IssuesConfig {
  types?: IssuesActivity[];
}

export type IssueCommentActivity = 'created' | 'edited' | 'deleted';

export interface IssueCommentConfig {
  types?: IssueCommentActivity[];
}

// ── repository_dispatch ────────────────────────────────────────────────

export interface RepositoryDispatchConfig {
  types?: string[];
}

// ── merge_group ────────────────────────────────────────────────────────

export interface MergeGroupConfig {
  types?: ('checks_requested' | 'destroyed')[];
  branches?: string[];
}

// ── discussion / discussion_comment ────────────────────────────────────

export interface DiscussionConfig {
  types?: (
    | 'created'
    | 'edited'
    | 'deleted'
    | 'transferred'
    | 'pinned'
    | 'unpinned'
    | 'labeled'
    | 'unlabeled'
    | 'locked'
    | 'unlocked'
    | 'category_changed'
    | 'answered'
    | 'unanswered'
  )[];
}

export interface DiscussionCommentConfig {
  types?: ('created' | 'edited' | 'deleted')[];
}

// ── check_run / check_suite ────────────────────────────────────────────

export interface CheckRunConfig {
  types?: ('created' | 'rerequested' | 'completed' | 'requested_action')[];
}

export interface CheckSuiteConfig {
  types?: ('completed' | 'requested' | 'rerequested')[];
}

// ── escape hatch for less common events ────────────────────────────────

/**
 * Catch-all config for trigger events that aren't explicitly typed in
 * this file. Accepts any object so workflows can still reference rare
 * events without losing type safety on the surrounding `Workflow`.
 */
export type OtherTriggerConfig = Record<string, unknown>;

// ── the canonical Triggers type ────────────────────────────────────────

/**
 * The full set of trigger events on a workflow's `on:` field.
 *
 * Only the canonical object form is accepted; the parser handles the
 * shorthand `on: push` and `on: [push, pull_request]` forms.
 *
 * The 15 most-used events have field-level types; less common events
 * fall through to `OtherTriggerConfig`.
 */
export interface Triggers {
  push?: PushConfig;
  pull_request?: PullRequestConfig;
  pull_request_target?: PullRequestTargetConfig;
  schedule?: ScheduleConfig[];
  workflow_dispatch?: WorkflowDispatchConfig | null;
  workflow_call?: WorkflowCallConfig | null;
  workflow_run?: WorkflowRunConfig;
  release?: ReleaseConfig;
  issues?: IssuesConfig;
  issue_comment?: IssueCommentConfig;
  repository_dispatch?: RepositoryDispatchConfig;
  merge_group?: MergeGroupConfig;
  discussion?: DiscussionConfig;
  discussion_comment?: DiscussionCommentConfig;
  check_run?: CheckRunConfig;
  check_suite?: CheckSuiteConfig;
  // Less common events: page_build, fork, watch, public, status, etc.
  // Keys here accept any value so workflows aren't blocked.
  page_build?: OtherTriggerConfig | null;
  fork?: OtherTriggerConfig | null;
  watch?: OtherTriggerConfig;
  public?: OtherTriggerConfig | null;
  status?: OtherTriggerConfig | null;
  create?: OtherTriggerConfig | null;
  delete?: OtherTriggerConfig | null;
  deployment?: OtherTriggerConfig | null;
  deployment_status?: OtherTriggerConfig | null;
  gollum?: OtherTriggerConfig | null;
  label?: OtherTriggerConfig;
  member?: OtherTriggerConfig;
  milestone?: OtherTriggerConfig;
  project?: OtherTriggerConfig;
  project_card?: OtherTriggerConfig;
  project_column?: OtherTriggerConfig;
  registry_package?: OtherTriggerConfig;
  star?: OtherTriggerConfig;
}
