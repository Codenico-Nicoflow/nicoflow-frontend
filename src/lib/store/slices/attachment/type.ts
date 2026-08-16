import type { AttachmentOwnerType, IAttachment } from '@nicoflow/shared/types';

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

// Presigned PUT target: PUT the raw file to `url` with the given `headers`
// (Content-Type), then echo `s3Key` back to confirm. (Was a POST policy with
// `fields`; R2 doesn't support POST policy — NIC-1679 — so uploads are PUT.)
export type GetUploadUrlResponse = {
  url: string;
  headers: Record<string, string>;
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

// Account-wide storage footprint. The byte cap spans every owner, so this can't
// be summed from one owner's list — the server is the only source.
export type GetStorageUsageResponse = {
  usedBytes: number;
  limitBytes: number;
};
