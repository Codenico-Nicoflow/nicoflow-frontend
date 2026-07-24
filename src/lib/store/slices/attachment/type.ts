import type { AttachmentOwnerType, IAttachment } from '@/lib/types';

// List query args — the polymorphic owner pair sent as ?ownerType=&ownerId=.
export type GetAttachmentsRequest = {
  ownerType: AttachmentOwnerType;
  ownerId: string;
};

export type GetAttachmentsResponse = IAttachment[];

// upload-url body: the owner + declared file metadata. `fileSize` is the
// client-claimed size (the backend re-reads the real size from S3 on confirm).
export type GetUploadUrlRequest = {
  ownerType: AttachmentOwnerType;
  ownerId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

// Presigned POST target: the fields must be posted (fields-then-file) to `url`,
// then `s3Key` echoed back to confirm.
export type GetUploadUrlResponse = {
  url: string;
  fields: Record<string, string>;
  s3Key: string;
};

// confirm body — only s3Key is trusted; fileName is the display name.
export type ConfirmAttachmentRequest = {
  s3Key: string;
  fileName: string;
};

export type ConfirmAttachmentResponse = IAttachment;

// download-url response — the backend returns { url } (not { downloadUrl }).
export type GetDownloadUrlResponse = {
  url: string;
};
