import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import type { TemplateMetadata } from '@arc-workflows/core';
import { TemplateGallery } from './template-gallery';

const templates: TemplateMetadata[] = [
  { id: 'ci-node', name: 'Node CI', description: 'Lint and test Node.js', tags: ['ci', 'node'] },
  {
    id: 'ci-python',
    name: 'Python CI',
    description: 'Lint and test Python',
    tags: ['ci', 'python'],
  },
  {
    id: 'deploy-vercel',
    name: 'Deploy to Vercel',
    description: 'Ship to Vercel',
    tags: ['deploy', 'vercel'],
  },
  {
    id: 'deploy-aws',
    name: 'Deploy to AWS',
    description: 'Ship to AWS',
    tags: ['deploy', 'aws'],
  },
  {
    id: 'release-semantic',
    name: 'Semantic Release',
    description: 'Automated releases',
    tags: ['release'],
  },
  {
    id: 'docker-build',
    name: 'Docker Build',
    description: 'Build and push image',
    tags: ['docker'],
  },
  { id: 'cron-task', name: 'Cron Task', description: 'Scheduled job', tags: ['cron'] },
  {
    id: 'manual-dispatch',
    name: 'Manual Dispatch',
    description: 'workflow_dispatch trigger',
    tags: ['manual'],
  },
  { id: 'reusable', name: 'Reusable', description: 'Reusable workflow', tags: ['reusable'] },
  {
    id: 'monorepo-ci',
    name: 'Monorepo CI',
    description: 'Monorepo aware CI',
    tags: ['ci', 'monorepo'],
  },
];

describe('TemplateGallery', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders all templates passed as props', () => {
    render(<TemplateGallery templates={templates} />);
    for (const t of templates) {
      expect(screen.getByText(t.name)).toBeDefined();
    }
  });

  it('filters by name', () => {
    render(<TemplateGallery templates={templates} />);
    const input = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(input, { target: { value: 'vercel' } });
    expect(screen.getByText('Deploy to Vercel')).toBeDefined();
    expect(screen.queryByText('Node CI')).toBeNull();
  });

  it('filters by description', () => {
    render(<TemplateGallery templates={templates} />);
    const input = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(input, { target: { value: 'Automated releases' } });
    expect(screen.getByText('Semantic Release')).toBeDefined();
    expect(screen.queryByText('Node CI')).toBeNull();
  });

  it('filters by tag', () => {
    render(<TemplateGallery templates={templates} />);
    const input = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(input, { target: { value: 'python' } });
    expect(screen.getByText('Python CI')).toBeDefined();
    expect(screen.queryByText('Node CI')).toBeNull();
  });

  it('shows empty state when no matches', () => {
    render(<TemplateGallery templates={templates} />);
    const input = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(input, { target: { value: 'nonexistent-xyz' } });
    expect(screen.getByText(/No templates match/)).toBeDefined();
  });
});
