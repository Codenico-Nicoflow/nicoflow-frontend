import type { ICategory } from '@my-monorepo/types';
import type { IconId } from '@my-monorepo/types';

export type GetAllCategoriesResponse = ICategory[];
export type GetCategoryResponse = ICategory;
export type CreateCategoryResponse = ICategory;
export type UpdateCategoryResponse = ICategory;
export type DeleteCategoryResponse = void;

export type GetAllCategoriesRequest = void;
export type GetCategoryRequest = number;

export type CreateCategoryRequest = {
  name: string;
  icon?: IconId;
};

export type UpdateCategoryRequest = {
  id: number;
  name?: string;
  icon?: IconId;
};

export type DeleteCategoryRequest = number;
