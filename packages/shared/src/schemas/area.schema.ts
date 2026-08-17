import { ICON_IDS } from '@nicoflow/shared/types';
import { z } from 'zod';

export { ICON_IDS, type IconId } from '@nicoflow/shared/types';

const V = {
  areaNameRequired: 'validation.areaNameRequired',
  areaNameMax: 'validation.areaNameMax',
  colorInvalid: 'validation.colorInvalid',
  iconInvalid: 'validation.iconInvalid',
} as const;

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, V.colorInvalid)
  .optional();

export const createAreaSchema = z.object({
  name: z.string().min(1, V.areaNameRequired).max(30, V.areaNameMax),
  color: hexColorSchema,
  icon: z.enum(ICON_IDS, { error: V.iconInvalid }).default('briefcase'),
});

export const updateAreaSchema = z.object({
  name: z.string().min(1, V.areaNameRequired).max(30, V.areaNameMax).optional(),
  color: hexColorSchema,
  icon: z.enum(ICON_IDS, { error: V.iconInvalid }).optional(),
});

export type AreaFormData = z.input<typeof createAreaSchema>;
