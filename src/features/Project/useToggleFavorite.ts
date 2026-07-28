import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import { canToggleFavorite } from '@/features/Rail/favorites';
import { areaApi, invalidateApiTags, projectApi, useGetProjectsQuery, useUpdateProjectMutation } from '@/lib/store';
import type { IProject } from '@/lib/types';
import { showErrorToast, ToastMessages } from '@/lib/utils';

/**
 * Star/unstar a project from anywhere. Shared by the row actions menu and the
 * project header so the cap is enforced identically at every entry point.
 */
export const useToggleFavorite = () => {
  const dispatch = useDispatch();
  // Already cached — the rail keeps this query warm on every screen.
  const { data: projectsData, isLoading } = useGetProjectsQuery();
  const [updateProject, { isLoading: isSaving }] = useUpdateProjectMutation();

  const toggle = async (project: IProject) => {
    const projects = projectsData?.items ?? [];
    if (!canToggleFavorite(projects, project)) {
      toast.error(ToastMessages.FAVORITE_LIMIT_REACHED);
      return;
    }

    try {
      await updateProject({ id: project.id, isFavorite: !project.isFavorite }).unwrap();
      invalidateApiTags(dispatch, projectApi, ['Project']);
      // Areas embed their projects, so the star has to refresh there too.
      invalidateApiTags(dispatch, areaApi, ['Area']);
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  return { toggle, isPending: isLoading || isSaving };
};
