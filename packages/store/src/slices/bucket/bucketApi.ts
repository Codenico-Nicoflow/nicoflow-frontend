import { createApi } from '@reduxjs/toolkit/query/react';

import { BUCKET_API } from '../../api/endpoints';
import { baseQueryWithReauth } from '../baseQuery';

import type { BucketResponse, BucketsResponse, CreateBucketDto, ProcessBucketDto, UpdateBucketDto } from './type';

export const bucketApi = createApi({
  reducerPath: 'bucketApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Bucket'],
  endpoints: builder => ({
    getBuckets: builder.query<BucketsResponse, void>({
      query: () => ({
        url: BUCKET_API.GET_BUCKETS,
        method: 'GET',
      }),
      providesTags: result =>
        result
          ? [...result.map(({ id }) => ({ type: 'Bucket' as const, id })), { type: 'Bucket', id: 'LIST' }]
          : [{ type: 'Bucket', id: 'LIST' }],
    }),
    getBucket: builder.query<BucketResponse, number>({
      query: id => ({
        url: `${BUCKET_API.GET_BUCKET}${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Bucket', id }],
    }),
    createBucket: builder.mutation<BucketResponse, CreateBucketDto>({
      query: body => ({
        url: BUCKET_API.CREATE_BUCKET,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bucket', id: 'LIST' }],
    }),
    updateBucket: builder.mutation<BucketResponse, { id: number; data: UpdateBucketDto }>({
      query: ({ id, data }) => ({
        url: `${BUCKET_API.UPDATE_BUCKET}${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Bucket', id },
        { type: 'Bucket', id: 'LIST' },
      ],
    }),
    deleteBucket: builder.mutation<void, number>({
      query: id => ({
        url: `${BUCKET_API.DELETE_BUCKET}${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Bucket', id },
        { type: 'Bucket', id: 'LIST' },
      ],
    }),
    processBucket: builder.mutation<BucketResponse, { id: number; data: ProcessBucketDto }>({
      query: ({ id, data }) => ({
        url: `${BUCKET_API.GET_BUCKET}${id}/process`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Bucket', id },
        { type: 'Bucket', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetBucketsQuery,
  useGetBucketQuery,
  useCreateBucketMutation,
  useUpdateBucketMutation,
  useDeleteBucketMutation,
  useProcessBucketMutation,
} = bucketApi;
