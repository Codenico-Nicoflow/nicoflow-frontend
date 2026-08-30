import type { ComponentType } from 'react';

import type { AIToolName } from '@/features/AI/types';

import { AreaProjectBody } from './AreaProjectBody';
import { BucketBody } from './BucketBody';
import { CreateNoteBody } from './CreateNoteBody';
import { RecurrenceBody } from './RecurrenceBody';
import { SubtaskBody } from './SubtaskBody';

export interface VariantBodyProps {
  input: unknown;
  taskTitles?: Record<string, string>;
  projectNames?: Record<string, string>;
}

// Each variant renders the rich body beneath a proposal card's headline. Tools
// not listed here get no body (the headline + reason text is enough context).
export const VARIANT_REGISTRY: Partial<Record<AIToolName, ComponentType<VariantBodyProps>>> = {
  setup_recurring_task: RecurrenceBody,
  adjust_recurring_task: RecurrenceBody,
  pause_recurring_task: RecurrenceBody,
  end_recurring_series: RecurrenceBody,
  create_note: CreateNoteBody,
  create_area: AreaProjectBody,
  create_project: AreaProjectBody,
  update_project: AreaProjectBody,
  add_subtask: SubtaskBody,
  complete_subtask: SubtaskBody,
  process_bucket_item: BucketBody,
};
