import { useEffect, useState, useCallback } from 'react';
import { PlayCircle, Lock, Loader2, Plus, X, Check, Pencil, Crown, Sparkles, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { MentorshipVideo } from '@/lib/types';
import { fetchVimeoThumbnail, extractVimeoId, vimeoThumbnailUrl } from '@/lib/vimeo';

function toEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const idMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/) || trimmed.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (idMatch) return `https://player.vimeo.com/video/${idMatch[1]}`;
  const srcMatch = trimmed.match(/src="https?:\/\/player\.vimeo\.com\/video\/(\d+)"/);
  if (srcMatch) return `https://player.vimeo.com/video/${srcMatch[1]}`;
  if (/^https?:\/\/player\.vimeo\.com\/video\/\d+/.test(trimmed)) return trimmed.split('?')[0];
  return null;
}

export function PremiumLibrary() {
  const { profile } = useAuth();
  const isAdmin = profile?.is_admin === true;
  const [videos, setVideos] = useState<MentorshipVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<MentorshipVideo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Admin editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mentorship_videos')
      .select('*')
      .order('position', { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setVideos((data as MentorshipVideo[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addVideo = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    setError(null);
    const embed = newUrl.trim() ? toEmbedUrl(newUrl.trim()) : null;
    const { data, error } = await supabase
      .from('mentorship_videos')
      .insert({
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        video_url: embed,
        position: videos.length,
        published: false,
      })
      .select()
      .maybeSingle();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNewTitle('');
    setNewDesc('');
    setNewUrl('');
    setShowAddForm(false);
    await load();
    if (data) {
      setActiveVideo(data as MentorshipVideo);
      if (embed) {
        fetchVimeoThumbnail(embed).then((o) => {
          if (o?.thumbnail_url) {
            supabase.from('mentorship_videos').update({ thumbnail_url: o.thumbnail_url }).eq('id', (data as MentorshipVideo).id).then(() => load());
          }
        });
      }
    }
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    setError(null);
    const embed = editUrl.trim() ? toEmbedUrl(editUrl.trim()) : null;
    const { error } = await supabase
      .from('mentorship_videos')
      .update({
        title: editTitle.trim(),
        description: editDesc.trim() || null,
        video_url: embed,
      })
      .eq('id', id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEditingId(null);
    await load();
    if (embed) {
      fetchVimeoThumbnail(embed).then((o) => {
        if (o?.thumbnail_url) {
          supabase.from('mentorship_videos').update({ thumbnail_url: o.thumbnail_url }).eq('id', id).then(() => load());
        }
      });
    }
  };

  const togglePublish = async (video: MentorshipVideo) => {
    setSaving(true);
    const { error } = await supabase
      .from('mentorship_videos')
      .update({ published: !video.published })
      .eq('id', video.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    await load();
  };

  const deleteVideo = async (id: string) => {
    if (!confirm('Delete this premium video? This cannot be undone.')) return;
    setSaving(true);
    const { error } = await supabase.from('mentorship_videos').delete().eq('id', id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (activeVideo?.id === id) setActiveVideo(null);
    await load();
  };

  const startEdit = (video: MentorshipVideo) => {
    setEditingId(video.id);
    setEditTitle(video.title);
    setEditDesc(video.description ?? '');
    setEditUrl(video.video_url ?? '');
  };

  const publishedVideos = videos.filter((v) => v.published || isAdmin);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={28} />
      </div>
    );
  }

  // Video player view
  if (activeVideo) {
    const embedUrl = activeVideo.video_url ? toEmbedUrl(activeVideo.video_url) : null;
    return (
      <div className="animate-fade-in">
        <button
          onClick={() => setActiveVideo(null)}
          className="mb-6 inline-flex items-center gap-2 text-[13px] font-medium text-cream-dim transition-colors hover:text-gold"
        >
          <ChevronLeft size={16} /> Back to Premium Library
        </button>

        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">
            <Crown size={13} /> Premium Exclusive
          </div>
          <h2 className="font-lux text-4xl font-bold leading-[0.95] sm:text-5xl" style={{ color: '#FBF4EC' }}>
            {activeVideo.title}
          </h2>
          {activeVideo.description && (
            <p className="mt-3.5 max-w-2xl text-[15px] leading-[1.85] text-cream-dim">{activeVideo.description}</p>
          )}
        </div>

        {embedUrl ? (
          <div className="overflow-hidden rounded-xl border border-gold/15 bg-black shadow-gold-glow">
            <div className="relative aspect-video w-full">
              <iframe
                src={embedUrl}
                title={activeVideo.title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-gold/15 bg-luxcard px-5 py-4 text-sm text-cream-dim">
            <PlayCircle size={18} className="text-gold/50" />
            Video link not available yet. Check back soon.
          </div>
        )}

        {/* Admin controls on player view */}
        {isAdmin && (
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => startEdit(activeVideo)}
              className="flex items-center gap-1.5 border border-gold/20 bg-luxcard px-4 py-2 text-xs font-bold uppercase tracking-wider text-gold transition-colors hover:bg-gold/10"
            >
              <Pencil size={13} /> Edit
            </button>
            <button
              onClick={() => togglePublish(activeVideo)}
              disabled={saving}
              className={`flex items-center gap-1.5 border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                activeVideo.published
                  ? 'border-green/30 bg-green/10 text-green hover:bg-green/20'
                  : 'border-gold/20 bg-luxcard text-gold hover:bg-gold/10'
              }`}
            >
              {activeVideo.published ? <><Check size={13} /> Published</> : <>Publish</>}
            </button>
            <button
              onClick={() => deleteVideo(activeVideo.id)}
              disabled={saving}
              className="flex items-center gap-1.5 border border-error/30 bg-error/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-error-soft transition-colors hover:bg-error/20"
            >
              <X size={13} /> Delete
            </button>
          </div>
        )}

        {/* Inline edit form */}
        {isAdmin && editingId === activeVideo.id && (
          <div className="mt-4 border border-gold/15 bg-luxcard p-6">
            <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-gold">Edit Video</div>
            <div className="flex flex-col gap-3">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title"
                className="border border-gold/20 bg-white/3 px-4 py-2.5 text-sm text-cream outline-none focus:border-gold"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Description (optional)"
                className="resize-vertical border border-gold/20 bg-white/3 px-4 py-2.5 text-sm text-cream outline-none focus:border-gold"
                style={{ minHeight: '70px' }}
              />
              <input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="Vimeo URL (e.g. https://vimeo.com/123456789)"
                className="border border-gold/20 bg-white/3 px-4 py-2.5 text-sm text-cream outline-none focus:border-gold"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(activeVideo.id)}
                  disabled={saving}
                  className="bg-gold px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-luxbg transition-colors hover:bg-gold-soft disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={13} /> : <Check size={13} />} Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="border border-gold/20 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-cream-dim transition-colors hover:text-cream"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div className="animate-fade-in">
      {error && (
        <div className="mb-4 flex items-center justify-between border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error-soft">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-error-soft/70 hover:text-error-soft">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 border-b border-gold/10 pb-6">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-gold">
          <Sparkles size={14} /> Mentorship Exclusive
        </div>
        <h2 className="font-lux text-4xl font-bold leading-[0.95] sm:text-5xl" style={{ color: '#FBF4EC' }}>
          Premium Video <em className="italic text-gold">Library</em>
        </h2>
        <p className="mt-3.5 max-w-2xl text-[15px] leading-[1.85] text-cream-dim">
          Exclusive video lessons available only to Mentorship members. These premium tutorials go deeper than anything in the public classroom — advanced techniques, behind-the-scenes sessions, and content you won't find anywhere else.
        </p>
      </div>

      {/* Add form */}
      {isAdmin && showAddForm && (
        <div className="mb-6 border border-gold/15 bg-luxcard p-6">
          <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-gold">Add New Premium Video</div>
          <div className="flex flex-col gap-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Video title"
              className="border border-gold/20 bg-white/3 px-4 py-2.5 text-sm text-cream outline-none focus:border-gold"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              className="resize-vertical border border-gold/20 bg-white/3 px-4 py-2.5 text-sm text-cream outline-none focus:border-gold"
              style={{ minHeight: '70px' }}
            />
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Vimeo URL (e.g. https://vimeo.com/123456789)"
              className="border border-gold/20 bg-white/3 px-4 py-2.5 text-sm text-cream outline-none focus:border-gold"
            />
            <div className="flex gap-2">
              <button
                onClick={addVideo}
                disabled={saving || !newTitle.trim()}
                className="bg-gold px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-luxbg transition-colors hover:bg-gold-soft disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={13} /> : <Plus size={13} />} Add Video
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="border border-gold/20 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-cream-dim transition-colors hover:text-cream"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video grid */}
      {publishedVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <PlayCircle size={48} className="text-gold/30" />
          <p className="font-lux text-2xl text-cream-dim">No premium videos yet</p>
          <p className="max-w-sm text-sm text-muted">
            {isAdmin
              ? 'Add your first exclusive video using the button above.'
              : 'New exclusive content is coming soon. Check back shortly.'}
          </p>
          {isAdmin && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 flex items-center gap-2 bg-gold px-6 py-3 text-xs font-bold uppercase tracking-wider text-luxbg transition-colors hover:bg-gold-soft"
            >
              <Plus size={14} /> Add First Video
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {publishedVideos.map((video) => {
            const embedUrl = video.video_url ? toEmbedUrl(video.video_url) : null;
            return (
              <button
                key={video.id}
                onClick={() => setActiveVideo(video)}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-gold/12 bg-luxcard text-left transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-gold-glow"
              >
                {/* Thumbnail area */}
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-burg/30 via-luxbg to-gold/10">
                  {(() => {
                    const vid = video.video_url ? extractVimeoId(video.video_url) : null;
                    const thumb = video.thumbnail_url || (vid ? vimeoThumbnailUrl(vid) : null);
                    if (thumb) {
                      return (
                        <img
                          src={thumb}
                          alt={video.title}
                          className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                        />
                      );
                    }
                    return (
                      <div className="flex h-full w-full items-center justify-center">
                        <PlayCircle size={40} className="text-gold/30 transition-all duration-300 group-hover:scale-110 group-hover:text-gold/50" />
                      </div>
                    );
                  })()}
                  <div className="absolute inset-0 bg-gradient-to-t from-luxbg/80 via-transparent to-transparent" />
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <span className="flex items-center gap-1 rounded-full border border-gold/30 bg-luxbg/80 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-gold backdrop-blur-sm">
                      <Crown size={10} /> Premium
                    </span>
                    {!video.published && isAdmin && (
                      <span className="rounded-full border border-cream-dim/30 bg-luxbg/80 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-cream-dim backdrop-blur-sm">
                        Draft
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h3 className="font-lux text-lg font-bold leading-tight text-cream transition-colors group-hover:text-gold">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-[13px] leading-[1.6] text-cream-dim line-clamp-2">
                      {video.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center gap-1.5 pt-2 text-[11px] font-bold uppercase tracking-wider text-gold/70 transition-colors group-hover:text-gold">
                    <PlayCircle size={13} /> Watch Now
                  </div>
                </div>

                {/* Admin quick controls on card */}
                {isAdmin && (
                  <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(video); setActiveVideo(video); }}
                      className="rounded-lg bg-luxbg/80 p-1.5 text-gold backdrop-blur-sm transition-colors hover:bg-gold hover:text-luxbg"
                      title="Edit"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePublish(video); }}
                      disabled={saving}
                      className={`rounded-lg p-1.5 backdrop-blur-sm transition-colors ${
                        video.published
                          ? 'bg-luxbg/80 text-green hover:bg-green hover:text-ivory'
                          : 'bg-luxbg/80 text-cream-dim hover:bg-cream hover:text-luxbg'
                      }`}
                      title={video.published ? 'Unpublish' : 'Publish'}
                    >
                      {video.published ? <Check size={12} /> : <Lock size={12} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteVideo(video.id); }}
                      disabled={saving}
                      className="rounded-lg bg-luxbg/80 p-1.5 text-error-soft backdrop-blur-sm transition-colors hover:bg-error hover:text-snow"
                      title="Delete"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </button>
            );
          })}

          {/* Add card — admin only */}
          {isAdmin && (
            <button
              onClick={() => setShowAddForm(true)}
              className="group flex min-h-[230px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gold/20 bg-luxmid/50 text-cream-dim transition-all duration-300 hover:border-gold/40 hover:text-gold hover:shadow-gold-glow"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-luxcard transition-transform duration-300 group-hover:scale-110">
                <Plus size={22} />
              </span>
              <span className="font-lux text-lg">New Premium Video</span>
              <span className="text-xs">Add exclusive content</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

