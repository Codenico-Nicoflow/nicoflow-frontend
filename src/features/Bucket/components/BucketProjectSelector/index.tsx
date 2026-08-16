import type { IProject } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';

interface BucketProjectSelectorProps {
  selectedProjectId: string | undefined;
  setSelectedProjectId: (projectId: string) => void;
  projects: IProject[];
  isLoading?: boolean;
}

export const BucketProjectSelector = ({
  selectedProjectId,
  setSelectedProjectId,
  projects,
  isLoading = false,
}: BucketProjectSelectorProps) => {
  const { t } = useTranslation('bucket');

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('projectSelector.label')}</label>
      <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={isLoading}>
        <SelectTrigger className="h-10">
          <SelectValue placeholder={isLoading ? t('projectSelector.loading') : t('projectSelector.placeholder')} />
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
