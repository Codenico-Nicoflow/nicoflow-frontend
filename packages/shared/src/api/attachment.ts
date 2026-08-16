import type { ApiEnvelope } from '@nicoflow/shared/types';
import { ATTACHMENT_API } from '@nicoflow/shared/types';
import { createApi } from '@reduxjs/toolkit/query/react';

import type { ApiBaseQuery } from './area';
import type {
  ConfirmAttachmentRequest,
  ConfirmAttachmentResponse,
  GetAttachmentsRequest,
  GetAttachmentsResponse,
  GetDownloadUrlResponse,
  GetStorageUsageResponse,
  GetUploadUrlRequest,
  GetUploadUrlResponse,
} from './attachment.types';

// Owner-parameterised attachment data layer. Tagged per owner —
// { type: 'Attachment', id: ownerId } — so a confirm/delete on one task's
// attachments refetches only that task's list, not every owner's. Reads and
// delete are open on any plan; upload-url + confirm are Pro-only on the backend
// (PLAN_LIMIT_EXCEEDED / STORAGE_LIMIT_EXCEEDED surface to the UI as upgrade
// prompts). The direct-to-S3 PUT is NOT here — see uploadToS3 (XHR, for progress).
export const createAttachmentApi = (baseQuery: ApiBaseQuery) => {
  const attachmentApi = createApi({
    reducerPath: 'attachmentApi',
    baseQuery,
    tagTypes: ['Attachment', 'StorageUsage'],
    endpoints: builder => ({
      // Account-wide, so it carries no owner id: a confirm/delete anywhere moves it.
      getStorageUsage: builder.query<GetStorageUsageResponse, void>({
        query: () => ATTACHMENT_API.USAGE,
        transformResponse: (raw: ApiEnvelope<GetStorageUsageResponse>) => raw.data,
        transformErrorResponse: error => error.data,
        providesTags: ['StorageUsage'],
      }),
      getAttachments: builder.query<GetAttachmentsResponse, GetAttachmentsRequest>({
        query: ({ ownerType, ownerId }) => {
          const qs = new URLSearchParams({ ownerType, ownerId }).toString();
          return `${ATTACHMENT_API.LIST}?${qs}`;
        },
        transformResponse: (raw: ApiEnvelope<GetAttachmentsResponse>) => raw.data,
        transformErrorResponse: error => error.data,
        providesTags: (_result, _error, { ownerId }) => [{ type: 'Attachment', id: ownerId }],
      }),
      getUploadUrl: builder.mutation<GetUploadUrlResponse, GetUploadUrlRequest>({
        query: body => ({
          url: ATTACHMENT_API.UPLOAD_URL,
          method: 'POST',
          body,
        }),
        transformResponse: (raw: ApiEnvelope<GetUploadUrlResponse>) => raw.data,
        transformErrorResponse: error => error.data,
      }),
      confirmAttachment: builder.mutation<ConfirmAttachmentResponse, ConfirmAttachmentRequest>({
        query: body => ({
          url: ATTACHMENT_API.CONFIRM,
          method: 'POST',
          body,
        }),
        transformResponse: (raw: ApiEnvelope<ConfirmAttachmentResponse>) => raw.data,
        transformErrorResponse: error => error.data,
        // Confirm returns the new AttachmentView; invalidate that owner's list and
        // the account-wide usage the storage bar reads.
        invalidatesTags: result =>
          result ? [{ type: 'Attachment' as const, id: result.ownerId }, 'StorageUsage' as const] : [],
      }),
      getDownloadUrl: builder.mutation<GetDownloadUrlResponse, string>({
        query: id => `${ATTACHMENT_API.DOWNLOAD_URL}${id}/download-url`,
        transformResponse: (raw: ApiEnvelope<GetDownloadUrlResponse>) => raw.data,
        transformErrorResponse: error => error.data,
      }),
      // Delete takes the ownerId alongside the id purely to target the tag — the
      // request itself is DELETE /attachments/{id}.
      deleteAttachment: builder.mutation<void, { id: string; ownerId: string }>({
        query: ({ id }) => ({
          url: `${ATTACHMENT_API.DELETE}${id}`,
          method: 'DELETE',
        }),
        transformErrorResponse: error => error.data,
        invalidatesTags: (_result, _error, { ownerId }) => [
          { type: 'Attachment' as const, id: ownerId },
          'StorageUsage' as const,
        ],
      }),
    }),
  });

  return attachmentApi;
};
