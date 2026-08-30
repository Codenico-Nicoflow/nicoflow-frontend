import { CheckSquare } from 'lucide-react';

interface SubtaskBodyProps {
  input: unknown;
  taskTitles?: Record<string, string>;
}

const getString = (obj: unknown, key: string): string | undefined => {
  if (!obj || typeof obj !== 'object') return undefined;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === 'string' && v ? v : undefined;
};

export const SubtaskBody = ({ input, taskTitles }: SubtaskBodyProps) => {
  const taskId = getString(input, 'taskId') ?? '';
  const parentTitle = taskTitles?.[taskId] ?? taskId;
  const subtaskTitle = getString(input, 'title') ?? getString(input, 'subtaskTitle');

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <CheckSquare className="size-3.5 shrink-0" aria-hidden />
      {subtaskTitle && <span className="font-medium text-foreground">{subtaskTitle}</span>}
      {parentTitle && (
        <>
          {subtaskTitle && <span aria-hidden>→</span>}
          <span>{parentTitle}</span>
        </>
      )}
    </div>
  );
};
