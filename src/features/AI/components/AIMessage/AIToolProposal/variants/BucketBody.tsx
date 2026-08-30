import { Inbox } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

interface BucketBodyProps {
  input: unknown;
  projectNames?: Record<string, string>;
}

const getString = (obj: unknown, key: string): string | undefined => {
  if (!obj || typeof obj !== 'object') return undefined;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === 'string' && v ? v : undefined;
};

export const BucketBody = ({ input, projectNames }: BucketBodyProps) => {
  const result = getString(input, 'result') ?? getString(input, 'processingResult');
  const projectId = getString(input, 'projectId');
  const project = projectId ? (projectNames?.[projectId] ?? projectId) : undefined;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
      <Inbox className="size-3.5 shrink-0" aria-hidden />
      {result && <Badge variant="secondary">{result}</Badge>}
      {project && <span>→ {project}</span>}
    </div>
  );
};
