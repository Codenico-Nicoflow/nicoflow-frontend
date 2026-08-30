import { describe, expect, it } from 'vitest';

import { toolInputToSummary } from './formatters';

describe('toolInputToSummary', () => {
  describe('complete_task', () => {
    it('resolves task id to display title when lookup map is provided', () => {
      const { headline } = toolInputToSummary(
        'complete_task',
        { taskId: 'task-1', reason: 'All done' },
        { 'task-1': 'Write PRD' }
      );
      expect(headline).toBe('Complete "Write PRD"');
    });

    it('falls back to raw task id when lookup map is missing', () => {
      const { headline } = toolInputToSummary('complete_task', { taskId: 'task-xyz' });
      expect(headline).toBe('Complete "task-xyz"');
    });

    it('falls back to raw id when task id is not in the lookup map', () => {
      const { headline } = toolInputToSummary('complete_task', { taskId: 'task-unknown' }, {});
      expect(headline).toBe('Complete "task-unknown"');
    });

    it('surfaces the reason field when present', () => {
      const { reason } = toolInputToSummary('complete_task', { taskId: 'task-1', reason: 'Shipped it' });
      expect(reason).toBe('Shipped it');
    });

    it('returns undefined reason when the field is absent', () => {
      const { reason } = toolInputToSummary('complete_task', { taskId: 'task-1' });
      expect(reason).toBeUndefined();
    });
  });

  describe('reschedule_task', () => {
    it('includes date and time in the headline when both are provided', () => {
      const { headline } = toolInputToSummary(
        'reschedule_task',
        { taskId: 'task-2', scheduledFor: '2026-08-10', scheduledTime: '09:00' },
        { 'task-2': 'Write PRD' }
      );
      expect(headline).toContain('Reschedule "Write PRD"');
      expect(headline).toContain('Aug 10');
      expect(headline).toContain('9:00');
    });

    it('shows "unscheduled" when scheduledFor is null/absent', () => {
      const { headline } = toolInputToSummary(
        'reschedule_task',
        { taskId: 'task-2', scheduledFor: null },
        { 'task-2': 'Write PRD' }
      );
      expect(headline).toContain('unscheduled');
    });

    it('falls back to raw task id when no lookup map is provided', () => {
      const { headline } = toolInputToSummary('reschedule_task', { taskId: 'task-abc' });
      expect(headline).toContain('task-abc');
    });
  });

  describe('create_task', () => {
    it('resolves project id to display name when lookup map is provided', () => {
      const { headline } = toolInputToSummary(
        'create_task',
        { projectId: 'proj-1', title: 'Draft outline' },
        undefined,
        { 'proj-1': 'Launch Campaign' }
      );
      expect(headline).toBe('Create "Draft outline" in Launch Campaign');
    });

    it('falls back to raw project id when no lookup map is provided', () => {
      const { headline } = toolInputToSummary('create_task', { projectId: 'proj-unknown', title: 'Draft outline' });
      expect(headline).toBe('Create "Draft outline" in proj-unknown');
    });

    it('uses "Untitled" when title field is missing', () => {
      const { headline } = toolInputToSummary('create_task', { projectId: 'proj-1' }, undefined, {
        'proj-1': 'Project X',
      });
      expect(headline).toBe('Create "Untitled" in Project X');
    });

    it('handles completely unknown/empty input without throwing', () => {
      expect(() => toolInputToSummary('create_task', null)).not.toThrow();
      expect(() => toolInputToSummary('create_task', {})).not.toThrow();
      expect(() => toolInputToSummary('create_task', 'bad')).not.toThrow();
    });
  });

  describe('new recurring / area / project / subtask / bucket tools', () => {
    it('setup_recurring_task uses title from input', () => {
      const { headline } = toolInputToSummary('setup_recurring_task', { title: 'Daily standup' });
      expect(headline).toBe('Set up recurring task "Daily standup"');
    });

    it('adjust_recurring_task resolves taskId via lookup map', () => {
      const { headline } = toolInputToSummary(
        'adjust_recurring_task',
        { taskId: 'task-1' },
        { 'task-1': 'Morning run' }
      );
      expect(headline).toBe('Adjust recurring schedule for "Morning run"');
    });

    it('end_recurring_series resolves taskId via lookup map', () => {
      const { headline } = toolInputToSummary(
        'end_recurring_series',
        { taskId: 'task-2' },
        { 'task-2': 'Weekly review' }
      );
      expect(headline).toBe('End recurring series for "Weekly review"');
    });

    it('create_note uses title from input', () => {
      const { headline } = toolInputToSummary('create_note', { title: 'Meeting notes' });
      expect(headline).toBe('Create note "Meeting notes"');
    });

    it('create_area uses name from input', () => {
      const { headline } = toolInputToSummary('create_area', { name: 'Personal' });
      expect(headline).toBe('Create area "Personal"');
    });

    it('create_project uses name from input', () => {
      const { headline } = toolInputToSummary('create_project', { name: 'Website redesign' });
      expect(headline).toBe('Create project "Website redesign"');
    });

    it('update_project resolves projectId via lookup map', () => {
      const { headline } = toolInputToSummary('update_project', { projectId: 'proj-2' }, undefined, {
        'proj-2': 'Q4 OKRs',
      });
      expect(headline).toBe('Update project "Q4 OKRs"');
    });

    it('add_subtask shows subtask title and parent task', () => {
      const { headline } = toolInputToSummary(
        'add_subtask',
        { taskId: 'task-1', title: 'Write tests' },
        { 'task-1': 'Ship feature' }
      );
      expect(headline).toContain('Write tests');
      expect(headline).toContain('Ship feature');
    });

    it('process_bucket_item shows processing result', () => {
      const { headline } = toolInputToSummary('process_bucket_item', { result: 'task' });
      expect(headline).toContain('task');
    });

    it('unknown future tool falls back to "Apply: <name>"', () => {
      // Cast to bypass TS exhaustiveness — simulates a future tool from the backend.
      const { headline } = toolInputToSummary('future_unknown_tool' as Parameters<typeof toolInputToSummary>[0], {});
      expect(headline).toContain('future_unknown_tool');
    });
  });
});
