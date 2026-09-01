import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ImageCropModalProps {
  file: File;
  onCancel: () => void;
  onCropped: (blob: Blob, fileName: string) => void;
}

const ASPECT = 1;
const OUTPUT_SIZE = 512;

export function ImageCropModal({ file, onCancel, onCropped }: ImageCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedArea(pixels);
  }, []);

  const produceCropped = async (): Promise<Blob> => {
    if (!croppedArea || !imageSrc) throw new Error('Crop not ready');

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Image load failed'));
      el.src = imageSrc;
    });

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      img,
      croppedArea.x,
      croppedArea.y,
      croppedArea.width,
      croppedArea.height,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Crop failed'))),
        'image/jpeg',
        0.92,
      );
    });
  };

  const confirm = async () => {
    setProcessing(true);
    try {
      const blob = await produceCropped();
      const baseName = file.name.replace(/\.[^.]+$/, '');
      onCropped(blob, `${baseName}.jpg`);
    } catch (err) {
      console.error('crop failed', err);
      setProcessing(false);
      alert('Could not process the crop. Please try a different photo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-pinkline bg-ink-100 p-5 shadow-glow">
        <h3 className="mb-3 font-display text-lg text-snow">Crop your photo</h3>
        <div className="relative h-64 w-full overflow-hidden rounded-xl bg-ink-200">
          {imageSrc ? (
            <>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={ASPECT}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-snow-dim">
              <Loader2 className="animate-spin" size={22} />
            </div>
          )}
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-xs text-snow-dim">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-gold"
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={processing || !imageSrc}>
            {processing ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
            Use photo
          </Button>
        </div>
      </div>
    </div>
  );
}
