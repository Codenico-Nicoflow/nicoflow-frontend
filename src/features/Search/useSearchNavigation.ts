import { useNavigate } from 'react-router-dom';

import type { SearchSelectPayload } from './SearchCommand';

export function useSearchNavigation() {
  const navigate = useNavigate();

  return (payload: SearchSelectPayload) => {
    if (payload.kind === 'task') {
      // Navigate to the task's project view, passing the task id in router
      // state so TasksSection can auto-open the edit dialog on mount.
      navigate(`/projects/${payload.item.projectId}`, {
        state: { editTaskId: payload.item.id },
      });
    } else if (payload.kind === 'project') {
      navigate(`/projects/${payload.item.id}`);
    } else if (payload.kind === 'note') {
      // Straight to the editor, which fetches the body from the scalar — the
      // search result carries only an excerpt.
      navigate(`/notes/${payload.item.id}`);
    } else {
      // No area detail route exists; navigate to /areas with the id in state
      // so AreasBoard can scroll the matching card into view and highlight it.
      navigate('/areas', { state: { highlightAreaId: payload.item.id } });
    }
  };
}
