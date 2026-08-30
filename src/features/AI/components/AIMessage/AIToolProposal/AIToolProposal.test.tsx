import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AIToolProposal } from './index';

const defaultProps = {
  toolUseId: 'toolu_abc',
  toolName: 'complete_task' as const,
  input: { taskId: 'task-1', reason: 'All done' },
  status: 'pending_confirm' as const,
  onConfirm: vi.fn(),
  onReject: vi.fn(),
  taskTitles: { 'task-1': 'Write PRD' },
};

describe('AIToolProposal', () => {
  it('renders the correct headline using the task title lookup map', () => {
    renderComponent(<AIToolProposal {...defaultProps} />);
    expect(screen.getByTestId('tool-proposal-headline')).toHaveTextContent('Complete "Write PRD"');
  });

  it('renders the correct headline using raw task id when no lookup map is provided', () => {
    renderComponent(<AIToolProposal {...defaultProps} taskTitles={undefined} input={{ taskId: 'task-unknown' }} />);
    expect(screen.getByTestId('tool-proposal-headline')).toHaveTextContent('Complete "task-unknown"');
  });

  it('renders the reason when present in input', () => {
    renderComponent(<AIToolProposal {...defaultProps} />);
    expect(screen.getByTestId('tool-proposal-reason')).toHaveTextContent('All done');
  });

  it('does not render a reason element when reason is absent', () => {
    renderComponent(<AIToolProposal {...defaultProps} input={{ taskId: 'task-1' }} />);
    expect(screen.queryByTestId('tool-proposal-reason')).not.toBeInTheDocument();
  });

  it('fires onConfirm with the correct toolUseId when Confirm is clicked', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    renderComponent(<AIToolProposal {...defaultProps} onConfirm={onConfirm} />);

    await user.click(screen.getByTestId('tool-proposal-confirm'));
    expect(onConfirm).toHaveBeenCalledWith('toolu_abc');
  });

  it('fires onReject with the correct toolUseId when Reject is clicked', async () => {
    const onReject = vi.fn();
    const user = userEvent.setup();
    renderComponent(<AIToolProposal {...defaultProps} onReject={onReject} />);

    await user.click(screen.getByTestId('tool-proposal-reject'));
    expect(onReject).toHaveBeenCalledWith('toolu_abc');
  });

  it('disables both buttons while status is executing', () => {
    renderComponent(<AIToolProposal {...defaultProps} status="executing" />);
    expect(screen.getByTestId('tool-proposal-confirm')).toBeDisabled();
    expect(screen.getByTestId('tool-proposal-reject')).toBeDisabled();
  });

  it('shows "Applied" chip and no buttons when status is done', () => {
    renderComponent(<AIToolProposal {...defaultProps} status="done" />);
    expect(screen.getByTestId('tool-proposal-applied')).toBeInTheDocument();
    expect(screen.queryByTestId('tool-proposal-confirm')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tool-proposal-reject')).not.toBeInTheDocument();
  });

  it('shows "Rejected" chip and no buttons when status is rejected', () => {
    renderComponent(<AIToolProposal {...defaultProps} status="rejected" />);
    expect(screen.getByTestId('tool-proposal-rejected')).toBeInTheDocument();
    expect(screen.queryByTestId('tool-proposal-confirm')).not.toBeInTheDocument();
  });

  it('shows "Already resolved" terminal state on 409 conflict (alreadyResolved=true)', () => {
    renderComponent(
      <AIToolProposal {...defaultProps} status="error" alreadyResolved errorMessage="Already resolved" />
    );
    expect(screen.getByTestId('tool-proposal-already-resolved')).toBeInTheDocument();
    expect(screen.queryByTestId('tool-proposal-confirm')).not.toBeInTheDocument();
  });

  it('shows retriable error state with action buttons on generic error (alreadyResolved=false)', () => {
    renderComponent(<AIToolProposal {...defaultProps} status="error" errorMessage="Network error" />);
    expect(screen.getByTestId('tool-proposal-error-message')).toHaveTextContent('Network error');
    expect(screen.getByTestId('tool-proposal-confirm')).toBeInTheDocument();
    expect(screen.getByTestId('tool-proposal-reject')).toBeInTheDocument();
  });

  it('renders correct headline for reschedule_task with lookup map', () => {
    renderComponent(
      <AIToolProposal
        {...defaultProps}
        toolName="reschedule_task"
        input={{ taskId: 'task-1', scheduledFor: '2026-08-10', scheduledTime: '09:00' }}
      />
    );
    const headline = screen.getByTestId('tool-proposal-headline').textContent ?? '';
    expect(headline).toContain('Reschedule');
    expect(headline).toContain('Write PRD');
  });

  it('renders correct headline for create_task with project lookup map', () => {
    renderComponent(
      <AIToolProposal
        {...defaultProps}
        toolName="create_task"
        input={{ projectId: 'proj-1', title: 'Draft outline' }}
        projectNames={{ 'proj-1': 'Launch Campaign' }}
      />
    );
    expect(screen.getByTestId('tool-proposal-headline')).toHaveTextContent('Create "Draft outline" in Launch Campaign');
  });

  it('renders correct headline for new recurring tool', () => {
    renderComponent(
      <AIToolProposal
        {...defaultProps}
        toolName="setup_recurring_task"
        input={{ title: 'Daily standup', freq: 'daily', interval: 1 }}
      />
    );
    expect(screen.getByTestId('tool-proposal-headline')).toHaveTextContent('Set up recurring task "Daily standup"');
  });

  it('renders correct headline for create_note', () => {
    renderComponent(<AIToolProposal {...defaultProps} toolName="create_note" input={{ title: 'Meeting notes' }} />);
    expect(screen.getByTestId('tool-proposal-headline')).toHaveTextContent('Create note "Meeting notes"');
  });

  it('renders the Tiptap note preview when create_note input has a blocks array', () => {
    renderComponent(
      <AIToolProposal
        {...defaultProps}
        toolName="create_note"
        input={{
          projectId: 'p-1',
          title: 'Meeting Notes',
          blocks: [
            { kind: 'heading', text: 'Agenda', level: 1 },
            { kind: 'bulletList', items: ['Discuss budget', 'Plan roadmap'] },
          ],
          reason: 'You asked for a note.',
        }}
      />
    );
    expect(screen.getByLabelText('Note preview')).toBeInTheDocument();
  });

  it('does not render a note preview when create_note input has no blocks', () => {
    renderComponent(<AIToolProposal {...defaultProps} toolName="create_note" input={{ title: 'No blocks here' }} />);
    expect(screen.queryByLabelText('Note preview')).not.toBeInTheDocument();
  });

  it('renders a fallback headline for an unrecognized tool name', () => {
    renderComponent(
      // Cast so TS accepts the unknown name without a type error
      <AIToolProposal
        {...defaultProps}
        toolName={'unknown_future_tool' as Parameters<typeof AIToolProposal>[0]['toolName']}
        input={{}}
      />
    );
    expect(screen.getByTestId('tool-proposal-headline')).toHaveTextContent('Apply:');
  });
});
