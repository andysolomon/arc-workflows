'use client';

import { useState, useMemo } from 'react';
import type { TemplateMetadata } from '@arc-workflows/core';
import { TemplateCard } from './template-card';
import { Input } from '@/components/ui/input';

interface Props {
  templates: TemplateMetadata[];
}

export function TemplateGallery({ templates }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [query, templates]);

  return (
    <div className="space-y-6">
      <Input
        type="search"
        placeholder="Search templates..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
        }}
        className="max-w-md"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => (
          <TemplateCard key={t.id} template={t} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-muted-foreground text-center py-8">
          No templates match &ldquo;{query}&rdquo;
        </p>
      )}
    </div>
  );
}
