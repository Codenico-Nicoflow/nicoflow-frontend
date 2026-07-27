import { useNavigate, useParams } from 'react-router-dom';

import { AITwoPanelShell } from '@/features/AI';
import { useCreateAISessionMutation } from '@/lib/store';

// The /ai page. Owns session selection + creation: the active session id comes
// from the route (:id), selecting navigates to /ai/:id, and creating a session
// navigates to the new one once the mutation resolves. All chat rendering lives
// in the two-panel shell.
const AIPage = () => {
  const navigate = useNavigate();
  const { id: activeId } = useParams<{ id: string }>();
  const [createSession, { isLoading: isCreating }] = useCreateAISessionMutation();

  const handleCreate = async () => {
    const session = await createSession({}).unwrap();
    navigate(`/ai/${session.id}`);
  };

  // Deleting the currently-open session leaves the route pointing at a gone id →
  // fall back to the bare /ai landing. Deleting any other session stays put.
  const handleDeleted = (id: string) => {
    if (id === activeId) navigate('/ai');
  };

  return (
    <div className="h-full" data-testid="ai-page">
      <AITwoPanelShell
        activeId={activeId}
        onSelect={id => navigate(`/ai/${id}`)}
        onCreate={handleCreate}
        onDeleted={handleDeleted}
        isCreating={isCreating}
      />
    </div>
  );
};

export default AIPage;
