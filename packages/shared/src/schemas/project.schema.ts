import { ICON_IDS } from '@nicoflow/shared/types';
import { z } from 'zod';

const V = {
  projectNameRequired: 'validation.projectNameRequired',
  projectNameMax: 'validation.projectNameMax',
  areaRequired: 'validation.areaRequired',
  descriptionMax: 'validation.descriptionMax',
  iconInvalid: 'validation.iconInvalid',
  statusInvalid: 'validation.statusInvalid',
} as const;

export const projectSchema = z.object({
  name: z.string().min(1, V.projectNameRequired).max(50, V.projectNameMax),
  areaId: z.string().min(1, V.areaRequired),
  folderIcon: z.enum(ICON_IDS, { error: V.iconInvalid }),
  status: z.enum(['active', 'completed', 'archived'], { error: V.statusInvalid }),
  dueDate: z.date().optional(),
  isFavorite: z.boolean().optional(),
  description: z.string().max(2000, V.descriptionMax).optional().nullable(),
});

export type ProjectFormData = z.output<typeof projectSchema>;
