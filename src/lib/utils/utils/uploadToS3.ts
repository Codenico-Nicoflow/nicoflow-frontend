// Direct browser → S3 upload for a presigned POST policy. This lives outside RTK
// Query on purpose: fetch can't report upload progress, so we drop to
// XMLHttpRequest for its `upload.onprogress`. Framework-agnostic + import-clean
// (no React / DOM-app coupling) so it survives the E-033 shared-package move.

export type UploadProgress = {
  loaded: number;
  total: number;
  ratio: number; // 0..1; total unknown ⇒ 0
};

export type UploadToS3Args = {
  url: string;
  fields: Record<string, string>;
  file: File;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
};

// Thrown on any non-2xx S3 response or a transport-level failure, carrying the
// HTTP status (0 for network/abort) so callers can branch without parsing S3's
// XML error body.
export class UploadError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'UploadError';
    this.status = status;
  }
}

// Uploads `file` to the presigned POST `url`. The S3 POST policy REQUIRES the
// policy fields to precede the file part in the multipart body, so fields are
// appended first and `file` last — reordering makes S3 reject the upload.
export const uploadToS3 = ({ url, fields, file, onProgress, signal }: UploadToS3Args): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new UploadError('upload aborted', 0));
      return;
    }

    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      form.append(key, value);
    }
    form.append('file', file); // must be last for the S3 POST policy

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.upload.onprogress = event => {
      if (!onProgress) return;
      const total = event.lengthComputable ? event.total : 0;
      const ratio = total > 0 ? event.loaded / total : 0;
      onProgress({ loaded: event.loaded, total, ratio });
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.({ loaded: file.size, total: file.size, ratio: 1 });
        resolve();
        return;
      }
      reject(new UploadError(`S3 upload failed with status ${xhr.status}`, xhr.status));
    };

    xhr.onerror = () => reject(new UploadError('network error during upload', 0));
    xhr.onabort = () => reject(new UploadError('upload aborted', 0));

    if (signal) {
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    xhr.send(form);
  });
