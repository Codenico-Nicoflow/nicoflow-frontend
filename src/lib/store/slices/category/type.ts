import type { ICategory } from '@/lib/types';

/* Category API */
export type GetAllCategoriesRequest = void;
export type GetCategoryRequest = number;
export type CreateCategoryRequest = Partial<ICategory>;
export type UpdateCategoryRequest = Partial<ICategory>;

export type GetAllCategoriesResponse = ICategory[];
export type GetCategoryResponse = ICategory;
export type CreateCategoryResponse = ICategory;
export type UpdateCategoryResponse = ICategory;
export type DeleteCategoryResponse = { message: string };
