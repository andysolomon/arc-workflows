import { listTemplates } from '@arc-workflows/core';
import { TemplateGallery } from '@/components/template-gallery';

export default function HomePage() {
  const templates = [...listTemplates()];
  return (
    <main className="container mx-auto py-12 px-4 max-w-6xl">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight">arc-workflows</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Build GitHub Actions workflows with confidence. Pick a template to get started.
        </p>
      </header>
      <TemplateGallery templates={templates} />
    </main>
  );
}
