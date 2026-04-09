import Link from 'next/link';
import type { TemplateMetadata } from '@arc-workflows/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  template: TemplateMetadata;
}

export function TemplateCard({ template }: Props) {
  return (
    <Link href={`/editor/${template.id}`} className="block">
      <Card className="h-full hover:border-primary transition-colors">
        <CardHeader>
          <CardTitle>{template.name}</CardTitle>
          <CardDescription>{template.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {template.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
