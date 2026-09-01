import { Upload as TusUpload } from 'tus-js-client';
import { supabase } from './supabase';
import { compressVideo } from './videoCompress';

interface TusUploadOptions {
  bucketId: string;
  path: string;
  file: File | Blob;
  contentType?: string;
  onProgress?: (percent: number) => void;
  onStatus?: (msg: string) => void;
  signal?: AbortSignal;
  compress?: boolean;
}

export interface TusUploadResult {
  publicUrl: string;
  fullPath: string;
}

export async function uploadWithTus(opts: TusUploadOptions): Promise<TusUploadResult> {
  const { bucketId, path, file, contentType, onProgress, onStatus, signal, compress } = opts;

  let uploadFile: File | Blob = file;
  let uploadContentType = contentType || (file as File).type || 'application/octet-stream';

  if (compress) {
    try {
      onStatus?.('Compressing video...');
      const result = await compressVideo(file, onStatus);
      uploadFile = result.blob;
      uploadContentType = 'video/mp4';
      if (result.compressed) {
        const savedPct = Math.round((1 - result.compressedSize / result.originalSize) * 100);
        onStatus?.(`Compressed: ${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (${savedPct}% smaller)`);
      }
    } catch (err) {
      onStatus?.('Compression failed, uploading original...');
    }
  }

  onStatus?.('Uploading...');
  const { data: session } = await supabase.auth.getSession();
  const accessToken = session?.session?.access_token;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const endpoint = `${supabaseUrl}/storage/v1/upload/resumable`;

  const safePath = path.replace(/^\/+/, '');

  const tusHeaders: Record<string, string> = {
    apikey: supabaseAnonKey,
    'x-upsert': 'true',
  };
  if (accessToken) tusHeaders.authorization = `Bearer ${accessToken}`;

  return new Promise<TusUploadResult>((resolve, reject) => {
    const upload = new TusUpload(uploadFile, {
      endpoint,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      metadata: {
        bucketName: bucketId,
        objectName: safePath,
        contentType: uploadContentType,
      },
      headers: tusHeaders,
      chunkSize: 6 * 1024 * 1024,
      onProgress: (bytesSent, bytesTotal) => {
        if (bytesTotal > 0 && onProgress) {
          onProgress(Math.round((bytesSent / bytesTotal) * 100));
        }
      },
      onSuccess: () => {
        const { data: pub } = supabase.storage.from(bucketId).getPublicUrl(safePath);
        resolve({ publicUrl: pub.publicUrl, fullPath: safePath });
      },
      onError: (error) => reject(error),
    });

    if (signal) {
      signal.addEventListener('abort', () => {
        upload.abort?.();
        reject(new DOMException('Aborted', 'AbortError'));
      });
    }

    upload.start();
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
