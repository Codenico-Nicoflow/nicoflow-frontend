import { useTranslation } from 'react-i18next';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import type { IProject } from '@/lib/types';

interface BucketProjectSelectorProps {
  selectedProjectId: string | undefined;
  setSelectedProjectId: (projectId: string) => void;
  projects: IProject[];
}

export const BucketProjectSelector = ({
  selectedProjectId,
  setSelectedProjectId,
  projects,
}: BucketProjectSelectorProps) => {
  const { t } = useTranslation('bucket');

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('projectSelector.label')}</label>
      <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
        <SelectTrigger className="h-10">
          <SelectValue placeholder={t('projectSelector.placeholder')} />
        </SelectTrigger>
        <SelectContent>
          {projects.map(project => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
