import { useEffect, useMemo, useState } from 'react';
import { Search, X, Play, FileText, FileArchive, Loader2, Film } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { VideoLibraryItem } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { extractVimeoId, vimeoThumbnailUrl } from '@/lib/vimeo';

const CATEGORY_TONES: Record<string, 'pink' | 'gold' | 'muted' | 'success' | 'draft'> = {
  Beginner: 'success',
  intermediate: 'gold',
  Advanced: 'draft',
  Serger: 'pink',
  general: 'muted',
  Technique: 'pink',
  Headwear: 'gold',
  Pets: 'success',
  'Software/Printing': 'muted',
};

export function VideoLibrary() {
  const [videos, setVideos] = useState<VideoLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<VideoLibraryItem | null>(null);
  const [brokenThumbs, setBrokenThumbs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('video_library')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
      } else if (data) {
        const items = data as VideoLibraryItem[];
        // Auto-populate missing thumbnails from vumbnail.com
        const needsThumb = items.filter(
          (v) => !v.thumbnail_url && v.vimeo_url && extractVimeoId(v.vimeo_url),
        );
        if (needsThumb.length > 0) {
          const updates: Record<string, string> = {};
          for (const v of needsThumb) {
            const vid = extractVimeoId(v.vimeo_url!);
            if (vid) updates[v.id] = vimeoThumbnailUrl(vid);
          }
          if (Object.keys(updates).length > 0) {
            setVideos(
              items.map((v) =>
                updates[v.id] ? { ...v, thumbnail_url: updates[v.id] } : v,
              ),
            );
            for (const [id, url] of Object.entries(updates)) {
              supabase.from('video_library').update({ thumbnail_url: url }).eq('id', id);
            }
          } else {
            setVideos(items);
          }
        } else {
          setVideos(items);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    videos.forEach((v) => set.add(v.category));
    return ['All', ...Array.from(set).sort()];
  }, [videos]);

  const filtered = useMemo(() => {
    return videos.filter((v) => {
      if (activeCategory !== 'All' && v.category !== activeCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          v.title.toLowerCase().includes(q) ||
          (v.description?.toLowerCase().includes(q) ?? false) ||
          v.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [videos, activeCategory, search]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-snow">Video Library</h1>
        <p className="mt-1 text-sm text-snow-dim">
          Browse our full collection of sewing tutorials — filter by category or search for a specific project.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error-soft">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-error-soft/70 hover:text-error-soft">
            <X size={15} />
          </button>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-snow-dim" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos..."
            className="w-full rounded-xl border border-pinkline bg-ink-50 py-2.5 pl-10 pr-4 text-sm text-snow placeholder:text-snow-dim/60 focus:border-hotpink/50 focus:shadow-glow focus:outline-none transition-all duration-200"
          />
        </div>
        <span className="text-xs text-snow-dim">{filtered.length} video{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
              activeCategory === cat
                ? 'bg-hotpink text-snow shadow-glow'
                : 'border border-pinkline bg-ink-100 text-snow-dim hover:border-hotpink/40 hover:text-snow'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-snow-dim">
          <Loader2 className="animate-spin" size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-pinkline bg-ink-100/50 py-20 text-center">
          <Film className="text-hotpink/50" size={32} />
          <p className="font-display text-xl text-snow">No videos found</p>
          <p className="text-sm text-snow-dim">Try a different search or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((video) => (
            <button
              key={video.id}
              onClick={() => setSelected(video)}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-pinkline bg-ink-100 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-strong hover:border-hotpink/40"
            >
              <div className="relative h-40 overflow-hidden">
                {(() => {
                  const vid = video.vimeo_url ? extractVimeoId(video.vimeo_url) : null;
                  const thumb = video.thumbnail_url || (vid ? vimeoThumbnailUrl(vid) : null);
                  if (thumb && !brokenThumbs.has(video.id)) {
                    return (
                      <img
                        src={thumb}
                        alt={video.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() =>
                          setBrokenThumbs((prev) => {
                            const next = new Set(prev);
                            next.add(video.id);
                            return next;
                          })
                        }
                      />
                    );
                  }
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-hotpink/30 via-ink-100 to-gold/20">
                      <span className="text-4xl">{video.thumbnail_emoji}</span>
                    </div>
                  );
                })()}
                <div className="absolute inset-0 flex items-center justify-center bg-ink/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-hotpink/50 bg-ink/80 shadow-glow-strong backdrop-blur-sm">
                    <Play className="ml-1 text-snow" size={22} fill="currentColor" />
                  </span>
                </div>
                <div className="absolute left-3 top-3">
                  <Badge tone={CATEGORY_TONES[video.category] || 'muted'}>{video.category}</Badge>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="font-display text-lg text-snow transition-colors group-hover:text-hotpink-soft">
                  {video.title}
                </h3>
                {video.description && (
                  <p className="line-clamp-2 text-sm leading-relaxed text-snow-dim">{video.description}</p>
                )}
                <div className="mt-auto flex items-center gap-3 pt-2">
                  {video.resource_pdf_url && (
                    <span className="flex items-center gap-1 text-xs text-gold-soft" title="PDF resource available">
                      <FileText size={13} /> PDF
                    </span>
                  )}
                  {video.templates_zip_url && (
                    <span className="flex items-center gap-1 text-xs text-gold-soft" title="Templates available">
                      <FileArchive size={13} /> Templates
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && <VideoPlayerModal video={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function VideoPlayerModal({ video, onClose }: { video: VideoLibraryItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-24">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className="relative z-10 flex w-full max-w-3xl flex-col rounded-2xl border border-pinkline bg-ink-100 shadow-glow-strong animate-scale-in"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-pinkline px-6 py-4">
          <div className="flex-1 pr-4">
            <h2 className="font-display text-xl text-snow">{video.title}</h2>
            {video.description && (
              <p className="mt-1 text-sm leading-relaxed text-snow-dim">{video.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-snow-dim transition-colors hover:bg-white/5 hover:text-snow"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {video.vimeo_url && (
            <div
              className="overflow-hidden rounded-xl border border-pinkline/50 [&_iframe]:absolute [&_iframe]:left-0 [&_iframe]:top-0 [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0 [&>div]:relative [&>div]:pt-[56.25%] [&>div>script]:hidden"
              dangerouslySetInnerHTML={{ __html: video.vimeo_url }}
            />
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge tone={CATEGORY_TONES[video.category] || 'muted'}>{video.category}</Badge>
            {video.published_at && (
              <span className="text-xs text-snow-dim">
                Published {new Date(video.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
          </div>

          {(video.resource_pdf_url || video.templates_zip_url) && (
            <div className="mt-5 border-t border-pinkline pt-4">
              <h3 className="mb-3 font-display text-sm uppercase tracking-wider text-snow-dim">Resources</h3>
              <div className="flex flex-wrap gap-3">
                {video.resource_pdf_url && (
                  <a
                    href={video.resource_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm font-semibold text-gold-soft transition-all duration-200 hover:border-gold/50 hover:bg-gold/20 hover:shadow-gold-glow"
                  >
                    <FileText size={16} /> Download PDF
                  </a>
                )}
                {video.templates_zip_url && (
                  <a
                    href={video.templates_zip_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-hotpink/30 bg-hotpink/10 px-4 py-2.5 text-sm font-semibold text-hotpink-soft transition-all duration-200 hover:border-hotpink/50 hover:bg-hotpink/20 hover:shadow-glow"
                  >
                    <FileArchive size={16} /> Download Templates
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
