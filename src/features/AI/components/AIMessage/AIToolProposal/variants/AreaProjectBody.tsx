import { FolderOpen } from 'lucide-react';

interface AreaProjectBodyProps {
  input: unknown;
  projectNames?: Record<string, string>;
}

const getString = (obj: unknown, key: string): string | undefined => {
  if (!obj || typeof obj !== 'object') return undefined;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === 'string' && v ? v : undefined;
};

export const AreaProjectBody = ({ input, projectNames }: AreaProjectBodyProps) => {
  const description = getString(input, 'description');
  const projectId = getString(input, 'projectId');
  const project = projectId ? (projectNames?.[projectId] ?? projectId) : undefined;
  const status = getString(input, 'status');

  if (!description && !project && !status) return null;

  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      {project && (
        <div className="flex items-center gap-1.5">
          <FolderOpen className="size-3.5 shrink-0" aria-hidden />
          <span>{project}</span>
        </div>
      )}
      {description && <p className="line-clamp-2">{description}</p>}
      {status && <p className="capitalize text-xs">{status}</p>}
    </div>
  );
};
