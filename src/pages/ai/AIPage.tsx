import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { AITwoPanelShell } from '@/features/AI';
import { useCreateAISessionMutation } from '@/lib/store';
import { showErrorToast } from '@/lib/utils';

// The /ai page. Owns session selection + creation: the active session id comes
// from the route (:id), selecting navigates to /ai/:id, and creating a session
// navigates to the new one once the mutation resolves. All chat rendering lives
// in the two-panel shell.
const AIPage = () => {
  const navigate = useNavigate();
  const { id: activeId } = useParams<{ id: string }>();
  const [createSession, { isLoading: isCreating }] = useCreateAISessionMutation();

  const handleCreate = async () => {
    try {
      const session = await createSession({}).unwrap();
      navigate(`/ai/${session.id}`);
    } catch (err) {
      // Creating a session can 503 (AI kill switch) or 429 (AI_LIMIT_REACHED).
      // Surface the typed code as a localized toast instead of a silent rejection.
      showErrorToast(err, toast);
    }
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
