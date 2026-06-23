import { format } from 'date-fns';
import { Calendar, Pencil, SquareArrowOutUpRight, Star, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ItemActionsMenu, LazyIcon } from '@/components';
import { Badge } from '@/components/ui/badge';
import type { IconId, IProject } from '@/lib/types';
import { cn, getProjectStatusColor } from '@/lib/utils';

interface ProjectRowProps {
  project: IProject;
  onEdit: () => void;
  onDelete: () => void;
  'data-testid'?: string;
}

export const ProjectRow = ({ project, onEdit, onDelete, 'data-testid': testId }: ProjectRowProps) => {
  const { t } = useTranslation('project');
  const navigate = useNavigate();
  const open = () => navigate(`/projects/${project.id}`);

  const isOverdue = !!project.dueDate && new Date() > new Date(project.dueDate) && project.status === 'active';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={e => e.key === 'Enter' && open()}
      data-testid={testId || 'project-row'}
      className="group flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <LazyIcon iconId={(project.folderIcon as IconId) || 'folder'} className="h-4 w-4 shrink-0 text-primary" />

      <span className="flex-1 min-w-0 truncate text-sm font-medium text-foreground">{project.name}</span>

      {project.isFavorite && <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-500 text-yellow-500" />}

      {project.dueDate && (
        <span
          className={cn(
            'hidden sm:flex items-center gap-1 text-xs',
            isOverdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
          )}
        >
          <Calendar className="h-3 w-3" />
          {format(new Date(project.dueDate), 'MMM dd')}
        </span>
      )}

      <Badge variant="secondary" className={cn('hidden sm:inline-flex text-xs', getProjectStatusColor(project.status))}>
        {
          { active: t('status.active'), completed: t('status.completed'), archived: t('status.archived') }[
            project.status
          ]
        }
      </Badge>

      <ItemActionsMenu
        triggerClassName="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        data-testid={testId ? `${testId}-actions` : 'project-row-actions'}
        actions={[
          { label: t('row.open'), icon: SquareArrowOutUpRight, onClick: open },
          { label: t('row.edit'), icon: Pencil, onClick: onEdit },
          { label: t('row.delete'), icon: Trash2, onClick: onDelete, destructive: true },
        ]}
      />
    </div>
  );
};
