import { useEffect, useState } from 'react';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const AVATAR_PROXY = `${SUPABASE_URL}/functions/v1/avatar-image`;

function avatarProxyUrl(src: string): string | null {
  try {
    const path = decodeURIComponent(new URL(src).pathname);
    const marker = '/storage/v1/object/public/avatars/';
    if (!path.startsWith(marker)) return null;
    const avatarPath = path.slice(marker.length);
    return `${AVATAR_PROXY}?path=${encodeURIComponent(avatarPath)}`;
  } catch {
    return null;
  }
}

export function Avatar({ name, src, size = 36, className = '' }: AvatarProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setImageSrc(null);
    setImageFailed(false);

    if (!src) return undefined;

    const proxyUrl = avatarProxyUrl(src);
    if (!proxyUrl) {
      setImageFailed(true);
      return undefined;
    }

    fetch(proxyUrl, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`Avatar request failed: ${response.status}`);
        return response.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setImageFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (imageSrc && !imageFailed) {
    return (
      <img
        src={imageSrc}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        onError={() => setImageFailed(true)}
        className={`shrink-0 rounded-full border border-pinkline object-cover ${className}`}
      />
    );
  }

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border border-pinkline bg-ink-200 font-display text-hotpink ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
