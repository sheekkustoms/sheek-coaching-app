import { supabase } from '@/lib/supabase';

export function extractVimeoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const m =
    trimmed.match(/player\.vimeo\.com\/video\/(\d+)/) ||
    trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/) ||
    trimmed.match(/^(\d{6,})$/);
  return m ? m[1] : null;
}

export function toVimeoEmbedUrl(input: string): string | null {
  const id = extractVimeoId(input);
  return id ? `https://player.vimeo.com/video/${id}` : null;
}

export function toVimeoEmbedHtml(input: string): string | null {
  const id = extractVimeoId(input);
  if (!id) return null;
  return `<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/${id}?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerpolicy="strict-origin-when-cross-origin" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="video"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>`;
}

export interface VimeoOEmbed {
  thumbnail_url: string | null;
  title: string | null;
  embed_html: string | null;
}

/**
 * Builds a direct thumbnail URL for a Vimeo video using vumbnail.com,
 * which works for private/unlisted Vimeo videos where the oEmbed API returns 404.
 */
export function vimeoThumbnailUrl(videoId: string): string {
  return `https://torylmfgtytagbcquksv.supabase.co/functions/v1/vimeo-thumbnail?image=${videoId}`;
}

export async function fetchVimeoThumbnail(input: string): Promise<VimeoOEmbed | null> {
  const id = extractVimeoId(input);
  if (!id) return null;
  return { thumbnail_url: vimeoThumbnailUrl(id), title: null, embed_html: null };
}

export async function saveVimeoThumbnail(
  videoInput: string,
  table: string,
  idColumn: string,
  id: string,
  thumbColumn = 'image_url',
): Promise<string | null> {
  const oembed = await fetchVimeoThumbnail(videoInput);
  if (!oembed?.thumbnail_url) return null;
  await supabase.from(table).update({ [thumbColumn]: oembed.thumbnail_url }).eq(idColumn, id);
  return oembed.thumbnail_url;
}
