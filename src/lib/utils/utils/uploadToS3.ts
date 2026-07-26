// Direct browser → object-store upload via a presigned PUT. This lives outside
// RTK Query on purpose: fetch can't report upload progress, so we drop to
// XMLHttpRequest for its `upload.onprogress`. Framework-agnostic + import-clean
// (no React / DOM-app coupling) so it survives the E-033 shared-package move.
//
// PUT, not POST: Cloudflare R2 (the staging/prod store) returns 501 for
// presigned POST-policy form uploads (NIC-1679), so the backend hands out a
// presigned PUT URL + the headers to send with the raw file body.

export type UploadProgress = {
  loaded: number;
  total: number;
  ratio: number; // 0..1; total unknown ⇒ 0
};

export type UploadToS3Args = {
  url: string;
  headers: Record<string, string>;
  file: File;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
};

// Thrown on any non-2xx store response or a transport-level failure, carrying the
// HTTP status (0 for network/abort) so callers can branch without parsing the
// store's XML error body.
export class UploadError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'UploadError';
    this.status = status;
  }
}

// PUTs the raw `file` bytes to the presigned `url`, sending the presigned
// `headers` (Content-Type). The body is the file itself — no multipart form.
export const uploadToS3 = ({ url, headers, file, onProgress, signal }: UploadToS3Args): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new UploadError('upload aborted', 0));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

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

    xhr.send(file);
  });
