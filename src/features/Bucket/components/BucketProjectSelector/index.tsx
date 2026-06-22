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
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Project *</label>
      <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
        <SelectTrigger className="h-10">
          <SelectValue placeholder="Select a project" />
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
