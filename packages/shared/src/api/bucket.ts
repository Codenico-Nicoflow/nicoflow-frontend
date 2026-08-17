import type { ApiEnvelope } from '@nicoflow/shared/types';
import { BUCKET_API } from '@nicoflow/shared/types';
import { createApi } from '@reduxjs/toolkit/query/react';

import type { ApiBaseQuery } from './area';
import type {
  BucketResponse,
  BucketsResponse,
  CreateBucketDto,
  ProcessBucketDto,
  UpdateBucketDto,
} from './bucket.types';

export const createBucketApi = (baseQuery: ApiBaseQuery) => {
  const bucketApi = createApi({
    reducerPath: 'bucketApi',
    baseQuery,
    tagTypes: ['Bucket'],
    endpoints: builder => ({
      getBuckets: builder.query<BucketsResponse, void>({
        query: () => ({
          url: BUCKET_API.GET_BUCKETS,
          method: 'GET',
        }),
        transformResponse: (raw: ApiEnvelope<BucketsResponse>) => raw.data,
        transformErrorResponse: error => error.data,
        providesTags: result =>
          result
            ? [...result.items.map(({ id }) => ({ type: 'Bucket' as const, id })), { type: 'Bucket', id: 'LIST' }]
            : [{ type: 'Bucket', id: 'LIST' }],
      }),
      getBucket: builder.query<BucketResponse, string>({
        query: id => ({
          url: `${BUCKET_API.GET_BUCKET}${id}`,
          method: 'GET',
        }),
        transformResponse: (raw: ApiEnvelope<BucketResponse>) => raw.data,
        transformErrorResponse: error => error.data,
        providesTags: (_, _error, id) => [{ type: 'Bucket', id }],
      }),
      createBucket: builder.mutation<BucketResponse, CreateBucketDto>({
        query: body => ({
          url: BUCKET_API.CREATE_BUCKET,
          method: 'POST',
          body,
        }),
        transformResponse: (raw: ApiEnvelope<BucketResponse>) => raw.data,
        transformErrorResponse: error => error.data,
        invalidatesTags: [{ type: 'Bucket', id: 'LIST' }],
      }),
      updateBucket: builder.mutation<BucketResponse, { id: string; data: UpdateBucketDto }>({
        query: ({ id, data }) => ({
          url: `${BUCKET_API.UPDATE_BUCKET}${id}`,
          method: 'PATCH',
          body: data,
        }),
        transformResponse: (raw: ApiEnvelope<BucketResponse>) => raw.data,
        transformErrorResponse: error => error.data,
        invalidatesTags: (_, _error, { id }) => [
          { type: 'Bucket', id },
          { type: 'Bucket', id: 'LIST' },
        ],
      }),
      deleteBucket: builder.mutation<void, string>({
        query: id => ({
          url: `${BUCKET_API.DELETE_BUCKET}${id}`,
          method: 'DELETE',
        }),
        transformErrorResponse: error => error.data,
        invalidatesTags: (_, _error, id) => [
          { type: 'Bucket', id },
          { type: 'Bucket', id: 'LIST' },
        ],
      }),
      processBucket: builder.mutation<BucketResponse, { id: string; data: ProcessBucketDto }>({
        query: ({ id, data }) => ({
          url: `${BUCKET_API.GET_BUCKET}${id}/process`,
          method: 'POST',
          body: data,
        }),
        transformResponse: (raw: ApiEnvelope<BucketResponse>) => raw.data,
        transformErrorResponse: error => error.data,
        invalidatesTags: (_, _error, { id }) => [
          { type: 'Bucket', id },
          { type: 'Bucket', id: 'LIST' },
        ],
      }),
    }),
  });

  return bucketApi;
};
