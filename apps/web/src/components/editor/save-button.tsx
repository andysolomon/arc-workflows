'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { signIn, signOut, useSession } from 'next-auth/react';
import type { Workflow } from '@arc-workflows/core';

interface Props {
  workflow: Workflow;
}

interface SaveError {
  error?: string;
}

export function SaveButton({ workflow }: Props): React.JSX.Element {
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');

  if (!session) {
    return <Button onClick={() => void signIn('github')}>Sign in with GitHub</Button>;
  }

  async function handleSave(): Promise<void> {
    setSaving(true);
    try {
      const genRes = await fetch('/api/v1/workflows/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow }),
      });
      const genData = (await genRes.json()) as { yaml?: string; message?: string };
      if (!genRes.ok || typeof genData.yaml !== 'string') {
        alert(`YAML generation failed: ${genData.message ?? 'unknown error'}`);
        return;
      }
      const yaml = genData.yaml;
      const slug = workflow.name?.toLowerCase().replace(/\s+/g, '-') ?? 'workflow';
      const path = `.github/workflows/${slug}.yml`;
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          branch,
          path,
          content: yaml,
          message: `Add ${workflow.name ?? 'workflow'} via arc-workflows`,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as SaveError;
        alert(`Save failed: ${err.error ?? 'unknown error'}`);
      } else {
        alert(`Saved to ${owner}/${repo}@${branch}:${path}`);
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!showForm) {
    return (
      <div className="flex gap-2">
        <Button onClick={() => setShowForm(true)}>Save to repo</Button>
        <Button variant="outline" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-end">
      <div>
        <label className="text-xs">Owner</label>
        <input
          className="block border rounded px-2 py-1 text-sm"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs">Repo</label>
        <input
          className="block border rounded px-2 py-1 text-sm"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs">Branch</label>
        <input
          className="block border rounded px-2 py-1 text-sm"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
        />
      </div>
      <Button onClick={() => void handleSave()} disabled={saving || !owner || !repo}>
        {saving ? 'Saving...' : 'Save'}
      </Button>
      <Button variant="outline" onClick={() => setShowForm(false)}>
        Cancel
      </Button>
    </div>
  );
}
