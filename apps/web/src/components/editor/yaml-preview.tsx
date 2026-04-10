'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { Workflow } from '@arc-workflows/core';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface Props {
  workflow: Workflow;
}

interface GenerateResponse {
  yaml?: string;
  message?: string;
}

export function YamlPreview({ workflow }: Props): React.JSX.Element {
  const [yaml, setYaml] = useState('# Generating...');

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch('/api/v1/workflows/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow }),
        });
        const data = (await res.json()) as GenerateResponse;
        if (cancelled) return;
        if (res.ok && typeof data.yaml === 'string') {
          setYaml(data.yaml);
        } else {
          setYaml(`# Error generating YAML\n# ${data.message ?? 'unknown error'}`);
        }
      } catch (err) {
        if (cancelled) return;
        setYaml(`# Error generating YAML\n# ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [workflow]);

  return (
    <MonacoEditor
      height="100%"
      defaultLanguage="yaml"
      value={yaml}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 13,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        // TODO: After Phase 2.5 ships the normalizing parser, flip readOnly
        // to false and wire onChange → parse → dispatch back to the workflow
        // reducer for two-way YAML editing.
      }}
      theme="vs-dark"
    />
  );
}
