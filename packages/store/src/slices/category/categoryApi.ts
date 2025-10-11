import { createApi } from '@reduxjs/toolkit/query/react';

import { CATEGORY_API } from '../../api/endpoints';
import { baseQueryWithReauth } from '../baseQuery';

import type {
  CreateCategoryRequest,
  CreateCategoryResponse,
  DeleteCategoryRequest,
  DeleteCategoryResponse,
  GetAllCategoriesResponse,
  GetCategoryRequest,
  GetCategoryResponse,
  UpdateCategoryRequest,
  UpdateCategoryResponse,
} from './type';

export const categoryApi = createApi({
  reducerPath: 'categoryApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Category'],
  endpoints: builder => ({
    getCategories: builder.query<GetAllCategoriesResponse, void>({
      query: () => CATEGORY_API.GET_CATEGORIES,
      transformErrorResponse: error => error.data,
      providesTags: ['Category'],
    }),
    getCategoriesWithProjects: builder.query<GetAllCategoriesResponse, void>({
      query: () => CATEGORY_API.GET_CATEGORIES_WITH_PROJECTS,
      transformErrorResponse: error => error.data,
      providesTags: ['Category'],
    }),
    getCategory: builder.query<GetCategoryResponse, GetCategoryRequest>({
      query: id => `${CATEGORY_API.GET_CATEGORY}${id}`,
      transformErrorResponse: error => error.data,
    }),
    createCategory: builder.mutation<CreateCategoryResponse, CreateCategoryRequest>({
      query: body => ({
        url: CATEGORY_API.CREATE_CATEGORY,
        method: 'POST',
        body,
      }),
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation<UpdateCategoryResponse, UpdateCategoryRequest>({
      query: ({ id, ...body }) => ({
        url: `${CATEGORY_API.UPDATE_CATEGORY}${id}`,
        method: 'PATCH',
        body,
      }),
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation<DeleteCategoryResponse, DeleteCategoryRequest>({
      query: id => ({
        url: `${CATEGORY_API.DELETE_CATEGORY}${id}`,
        method: 'DELETE',
      }),
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Category'],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoriesWithProjectsQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} = categoryApi;
