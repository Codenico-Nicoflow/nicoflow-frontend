import type { IArea } from '@/lib/types';

export type GetAllAreasRequest = void;
export type GetAreaRequest = number;
export type CreateAreaRequest = Partial<IArea>;
export type UpdateAreaRequest = Partial<IArea>;

export type GetAllAreasResponse = IArea[];
export type GetAreaResponse = IArea;
export type CreateAreaResponse = IArea;
export type UpdateAreaResponse = IArea;
export type DeleteAreaResponse = { message: string };
