import type { AIToolName } from '@/features/AI/types';

// Safely extracts a string field from an unknown input object.
const getString = (input: unknown, key: string): string | undefined => {
  if (!input || typeof input !== 'object') return undefined;
  const val = (input as Record<string, unknown>)[key];
  return typeof val === 'string' && val ? val : undefined;
};

// Formats a scheduledFor date string (YYYY-MM-DD) into a compact locale string.
const formatDate = (raw: string | undefined): string | undefined => {
  if (!raw) return undefined;
  try {
    return new Date(raw).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return raw;
  }
};

// Formats a scheduledTime (HH:MM:SS or HH:MM) into h:mm AM/PM.
const formatTime = (raw: string | undefined): string | undefined => {
  if (!raw) return undefined;
  // Build a dummy date to drive Intl — we only want the time portion.
  const d = new Date(`1970-01-01T${raw}`);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export interface ToolSummary {
  headline: string;
  reason: string | undefined;
}

// toolInputToSummary produces a single human-readable summary line per tool.
// When taskTitles / projectNames lookup maps are provided (by the parent) they
// are used to resolve ids to display names; otherwise the raw id is shown.
export const toolInputToSummary = (
  toolName: AIToolName,
  input: unknown,
  taskTitles?: Record<string, string>,
  projectNames?: Record<string, string>
): ToolSummary => {
  const reason = getString(input, 'reason');

  switch (toolName) {
    case 'complete_task': {
      const taskId = getString(input, 'taskId') ?? '';
      const title = taskTitles?.[taskId] ?? taskId;
      return { headline: `Complete "${title}"`, reason };
    }

    case 'reschedule_task': {
      const taskId = getString(input, 'taskId') ?? '';
      const title = taskTitles?.[taskId] ?? taskId;
      const scheduledFor = getString(input, 'scheduledFor');
      const scheduledTime = getString(input, 'scheduledTime');
      const datePart = formatDate(scheduledFor);
      const timePart = formatTime(scheduledTime);
      const destination = [datePart, timePart].filter(Boolean).join(' at ') || 'unscheduled';
      return { headline: `Reschedule "${title}" → ${destination}`, reason };
    }

    case 'create_task': {
      const title = getString(input, 'title') ?? 'Untitled';
      const projectId = getString(input, 'projectId') ?? '';
      const project = projectNames?.[projectId] ?? projectId;
      return { headline: `Create "${title}" in ${project}`, reason };
    }
  }
};
