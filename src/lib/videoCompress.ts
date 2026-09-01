import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

const CORE_VERSION = '0.12.9';
const CORE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.js`;
const WASM_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.wasm`;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({
      coreURL: await toBlobURL(CORE_URL, 'text/javascript'),
      wasmURL: await toBlobURL(WASM_URL, 'application/wasm'),
    });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  try {
    return await loadPromise;
  } finally {
    loadPromise = null;
  }
}

export interface CompressResult {
  blob: Blob;
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
}

export async function compressVideo(
  file: File | Blob,
  onProgress?: (msg: string) => void,
): Promise<CompressResult> {
  const originalSize = file.size;
  const isVideo = (file as File).type?.startsWith('video/') || (file as File).name?.match(/\.(mp4|mov|webm|m4v|avi|mkv)$/i);

  if (!isVideo || originalSize < 10 * 1024 * 1024) {
    return { blob: file, compressed: false, originalSize, compressedSize: originalSize };
  }

  onProgress?.('Loading video processor...');
  const ffmpeg = await getFFmpeg();

  const inputName = 'input.mp4';
  const outputName = 'output.mp4';

  onProgress?.('Preparing video...');
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  onProgress?.('Compressing video...');
  await ffmpeg.exec([
    '-i', inputName,
    '-vf', 'scale=1280:-2',
    '-crf', '28',
    '-preset', 'fast',
    '-c:a', 'aac',
    '-b:a', '128k',
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  const compressedBlob = new Blob([data], { type: 'video/mp4' });

  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  return {
    blob: compressedBlob,
    compressed: true,
    originalSize,
    compressedSize: compressedBlob.size,
  };
}
