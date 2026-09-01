import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  Search, X, Play, FileText, FileArchive, Loader2, Film, Plus, BookOpen,
  ImagePlus, Lock, DollarSign, Pencil, Trash2, AlertTriangle, FileArchive as ZipIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import type { Course, CoursePurchase, CourseWithSections, VideoLibraryItem } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { NewCourseModal } from './NewCourseModal';
import { ZipImportModal } from './ZipImportModal';
import { VideoEditModal } from './VideoEditModal';

interface LearningHubProps {
  onOpenCourse: (course: CourseWithSections) => void;
}

type FilterType = 'all' | 'videos' | 'courses';

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

export function LearningHub({ onOpenCourse }: LearningHubProps) {
  const { profile, user } = useAuth();
  const canManage = hasPermission(profile, 'manage_content');

  const [videos, setVideos] = useState<VideoLibraryItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [purchases, setPurchases] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterType>('all');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [brokenThumbs, setBrokenThumbs] = useState<Set<string>>(new Set());

  const [selectedVideo, setSelectedVideo] = useState<VideoLibraryItem | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoLibraryItem | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<VideoLibraryItem | null>(null);
  const [deleteVideoBusy, setDeleteVideoBusy] = useState(false);

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [zipOpen, setZipOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [deleteCourseBusy, setDeleteCourseBusy] = useState(false);
  const [editingThumb, setEditingThumb] = useState<string | null>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const [vidRes, courseRes, purchRes] = await Promise.all([
      supabase.from('video_library').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
      supabase.from('courses').select('*').order('created_at', { ascending: false }),
      supabase.from('course_purchases').select('course_id'),
    ]);
    if (vidRes.data) setVideos(vidRes.data as VideoLibraryItem[]);
    if (courseRes.data) setCourses(courseRes.data as Course[]);
    if (purchRes.data) setPurchases(new Set((purchRes.data as CoursePurchase[]).map((p) => p.course_id)));
    if (vidRes.error) setError(vidRes.error.message);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    if (filter !== 'courses') videos.forEach((v) => set.add(v.category));
    if (filter !== 'videos') courses.forEach((c) => set.add('Course'));
    return ['All', ...Array.from(set).sort()];
  }, [videos, courses, filter]);

  const filteredVideos = useMemo(() => {
    if (filter === 'courses') return [];
    return videos.filter((v) => {
      if (activeCategory !== 'All' && v.category !== activeCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return v.title.toLowerCase().includes(q) || (v.description?.toLowerCase().includes(q) ?? false) || v.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [videos, filter, activeCategory, search]);

  const filteredCourses = useMemo(() => {
    if (filter === 'videos') return [];
    return courses.filter((c) => {
      if (activeCategory !== 'All' && activeCategory !== 'Course') return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return c.title.toLowerCase().includes(q);
      }
      return true;
    });
  }, [courses, filter, activeCategory, search]);

  const totalCount = filteredVideos.length + filteredCourses.length;

  // --- Course thumbnail management ---
  const onPickThumb = (courseId: string) => { setEditingThumb(courseId); fileRef.current?.click(); };

  const onThumbChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingThumb) return;
    setUploadingThumb(true);
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${editingThumb}/thumb.${ext}`;
    const { error: upErr } = await supabase.storage.from('course-thumbnails').upload(path, file, { upsert: true });
    if (upErr) { setUploadingThumb(false); setError(upErr.message); setEditingThumb(null); e.target.value = ''; return; }
    const { data: pub } = supabase.storage.from('course-thumbnails').getPublicUrl(path);
    const url = pub.publicUrl + `?t=${Date.now()}`;
    const { error: updErr } = await supabase.from('courses').update({ thumbnail_url: url }).eq('id', editingThumb);
    setUploadingThumb(false); setEditingThumb(null); e.target.value = '';
    if (updErr) { setError(updErr.message); return; }
    setCourses((cur) => cur.map((c) => (c.id === editingThumb ? { ...c, thumbnail_url: url } : c)));
  };

  const removeThumb = async (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (course?.thumbnail_url) {
      const ext = course.thumbnail_url.split('/').pop()?.split('?')[0]?.split('.').pop() || 'jpg';
      await supabase.storage.from('course-thumbnails').remove([`${courseId}/thumb.${ext}`]);
    }
    const { error } = await supabase.from('courses').update({ thumbnail_url: null }).eq('id', courseId);
    if (error) { setError(error.message); return; }
    setCourses((cur) => cur.map((c) => (c.id === courseId ? { ...c, thumbnail_url: null } : c)));
  };

  const startCheckout = async (courseId: string) => {
    setCheckingOut(courseId);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Please sign in to purchase a course.'); setCheckingOut(null); return; }
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to start checkout.'); setCheckingOut(null); return; }
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setCheckingOut(null);
    }
  };

  const isPaid = (course: Course) => (course.price ?? 0) > 0;
  const isLocked = (course: Course) => isPaid(course) && !purchases.has(course.id) && !canManage;
  const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}`;

  const confirmDeleteCourse = async () => {
    if (!deletingCourse) return;
    setDeleteCourseBusy(true);
    setError(null);
    if (deletingCourse.thumbnail_url) {
      const ext = deletingCourse.thumbnail_url.split('/').pop()?.split('?')[0]?.split('.').pop() || 'jpg';
      await supabase.storage.from('course-thumbnails').remove([`${deletingCourse.id}/thumb.${ext}`]);
    }
    const { error: delErr } = await supabase.from('courses').delete().eq('id', deletingCourse.id);
    setDeleteCourseBusy(false);
    if (delErr) { setError(delErr.message); return; }
    setDeletingCourse(null);
    load();
  };

  const confirmDeleteVideo = async () => {
    if (!deletingVideo) return;
    setDeleteVideoBusy(true);
    setError(null);
    const { error: delErr } = await supabase.from('video_library').delete().eq('id', deletingVideo.id);
    setDeleteVideoBusy(false);
    if (delErr) { setError(delErr.message); return; }
    setDeletingVideo(null);
    load();
  };

  return (
    <div className="animate-fade-in">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onThumbChange} />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-snow">Learning Hub</h1>
          <p className="mt-1 text-sm text-snow-dim">Browse tutorials, courses, and lessons — all in one place.</p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button variant="subtle" size="sm" onClick={() => { setEditingVideo(null); setVideoModalOpen(true); }}>
              <Plus size={14} /> Add Video
            </Button>
            <Button variant="subtle" size="sm" onClick={() => { setEditingCourse(null); setCourseModalOpen(true); }}>
              <Plus size={14} /> New Course
            </Button>
            <Button variant="subtle" size="sm" onClick={() => setZipOpen(true)}>
              <ZipIcon size={14} /> Import Zip
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error-soft">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-error-soft/70 hover:text-error-soft"><X size={15} /></button>
        </div>
      )}

      {/* Search + filter row */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-snow-dim" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos and courses..."
            className="w-full rounded-xl border border-pinkline bg-ink-50 py-2.5 pl-10 pr-4 text-sm text-snow placeholder:text-snow-dim/60 focus:border-hotpink/50 focus:shadow-glow focus:outline-none transition-all duration-200"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-pinkline bg-ink-100 p-0.5">
            {(['all', 'videos', 'courses'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setActiveCategory('All'); }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-all duration-200 ${
                  filter === f ? 'bg-hotpink text-snow shadow-glow' : 'text-snow-dim hover:text-snow'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="hidden text-xs text-snow-dim sm:inline">{totalCount} item{totalCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Category tabs */}
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
      ) : totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-pinkline bg-ink-100/50 py-20 text-center">
          <Film className="text-hotpink/50" size={32} />
          <p className="font-display text-xl text-snow">Nothing found</p>
          <p className="text-sm text-snow-dim">Try a different search or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Videos */}
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-pinkline bg-ink-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-strong hover:border-hotpink/40"
            >
              <button onClick={() => setSelectedVideo(video)} className="relative block h-40 overflow-hidden">
                {video.thumbnail_url && !brokenThumbs.has(video.id) ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() => setBrokenThumbs((prev) => { const n = new Set(prev); n.add(video.id); return n; })}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-hotpink/30 via-ink-100 to-gold/20">
                    <span className="text-4xl">{video.thumbnail_emoji}</span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-ink/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-hotpink/50 bg-ink/80 shadow-glow-strong backdrop-blur-sm">
                    <Play className="ml-1 text-snow" size={22} fill="currentColor" />
                  </span>
                </div>
                <div className="absolute left-3 top-3">
                  <Badge tone={CATEGORY_TONES[video.category] || 'muted'}>{video.category}</Badge>
                </div>
              </button>

              {canManage && (
                <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingVideo(video); setVideoModalOpen(true); }}
                    className="rounded-lg bg-ink/80 p-1.5 text-snow backdrop-blur-sm transition-colors hover:bg-gold hover:text-ink"
                    title="Edit video"
                  ><Pencil size={14} /></button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingVideo(video); }}
                    className="rounded-lg bg-ink/80 p-1.5 text-snow backdrop-blur-sm transition-colors hover:bg-error hover:text-snow"
                    title="Delete video"
                  ><Trash2 size={14} /></button>
                </div>
              )}

              <button onClick={() => setSelectedVideo(video)} className="flex flex-1 flex-col gap-2 p-4 text-left">
                <h3 className="font-display text-lg text-snow transition-colors group-hover:text-hotpink-soft">{video.title}</h3>
                {video.description && <p className="line-clamp-2 text-sm leading-relaxed text-snow-dim">{video.description}</p>}
                <div className="mt-auto flex items-center gap-3 pt-2">
                  {video.resource_pdf_url && <span className="flex items-center gap-1 text-xs text-gold-soft"><FileText size={13} /> PDF</span>}
                  {video.templates_zip_url && <span className="flex items-center gap-1 text-xs text-gold-soft"><FileArchive size={13} /> Templates</span>}
                </div>
              </button>
            </div>
          ))}

          {/* Courses */}
          {filteredCourses.map((course) => {
            const locked = isLocked(course);
            const paid = isPaid(course);
            return (
              <div
                key={course.id}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-ink-100 transition-all duration-300 ${
                  locked ? 'border-pinkline/60' : 'border-pinkline hover:-translate-y-1 hover:shadow-glow-strong hover:border-hotpink/40'
                }`}
              >
                <button
                  onClick={() => !locked && onOpenCourse({ ...course, sections: [] })}
                  className="relative block h-40 overflow-hidden"
                >
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className={`h-full w-full object-cover transition-transform duration-500 ${locked ? 'opacity-40 grayscale' : 'group-hover:scale-105'}`}
                    />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-hotpink/30 via-ink-100 to-gold/20 ${locked ? 'opacity-40' : ''}`}>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,20,147,0.25),transparent_60%)]" />
                      <span className="relative px-4 text-center font-display text-lg leading-snug text-snow/95 text-balance drop-shadow-md">{course.title}</span>
                    </div>
                  )}
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <Badge tone="pink">Course</Badge>
                    {paid && !locked && <Badge tone="gold">Owned</Badge>}
                  </div>
                  {locked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-ink/40 backdrop-blur-[2px]">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-pinkline bg-ink-100/80 shadow-glow">
                        <Lock className="text-hotpink" size={20} />
                      </span>
                    </div>
                  )}
                </button>

                {canManage && (
                  <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); onPickThumb(course.id); }}
                      disabled={uploadingThumb && editingThumb === course.id}
                      className="rounded-lg bg-ink/80 p-1.5 text-snow backdrop-blur-sm transition-colors hover:bg-hotpink hover:text-snow"
                      title="Upload thumbnail"
                    >{uploadingThumb && editingThumb === course.id ? <Loader2 className="animate-spin" size={14} /> : <ImagePlus size={14} />}</button>
                    {course.thumbnail_url && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeThumb(course.id); }}
                        className="rounded-lg bg-ink/80 p-1.5 text-snow backdrop-blur-sm transition-colors hover:bg-error hover:text-snow"
                        title="Remove thumbnail"
                      ><X size={14} /></button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingCourse(course); setCourseModalOpen(true); }}
                      className="rounded-lg bg-ink/80 p-1.5 text-snow backdrop-blur-sm transition-colors hover:bg-gold hover:text-ink"
                      title="Edit course"
                    ><Pencil size={14} /></button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingCourse(course); }}
                      className="rounded-lg bg-ink/80 p-1.5 text-snow backdrop-blur-sm transition-colors hover:bg-error hover:text-snow"
                      title="Delete course"
                    ><Trash2 size={14} /></button>
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <h3 className="font-display text-lg text-snow transition-colors group-hover:text-hotpink-soft">{course.title}</h3>
                  <div className="mt-auto">
                    {locked ? (
                      <button
                        onClick={() => startCheckout(course.id)}
                        disabled={checkingOut === course.id}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-hotpink/40 bg-hotpink/10 px-4 py-2.5 text-sm font-semibold text-hotpink-soft transition-all duration-200 hover:border-hotpink/60 hover:bg-hotpink/20 hover:shadow-glow"
                      >
                        {checkingOut === course.id ? <Loader2 className="animate-spin" size={15} /> : <Lock size={15} />}
                        Unlock — {formatPrice(course.price!)}
                      </button>
                    ) : (
                      <div className="mb-1.5 flex items-center justify-between text-xs text-snow-dim">
                        <span>{paid ? 'Purchased' : 'Free with membership'}</span>
                        <span>Open course →</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video player modal */}
      {selectedVideo && <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}

      {/* Video edit modal */}
      <VideoEditModal
        open={videoModalOpen}
        onClose={() => { setVideoModalOpen(false); setEditingVideo(null); }}
        onSaved={load}
        editingVideo={editingVideo}
      />

      {/* Course create/edit modal */}
      <NewCourseModal
        open={courseModalOpen || !!editingCourse}
        editingCourse={editingCourse}
        onClose={() => { setCourseModalOpen(false); setEditingCourse(null); }}
        onCreated={load}
      />

      {/* Zip import */}
      <ZipImportModal open={zipOpen} onClose={() => setZipOpen(false)} onCreated={load} />

      {/* Delete course modal */}
      <Modal
        open={!!deletingCourse}
        onClose={() => setDeletingCourse(null)}
        title="Delete Course"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingCourse(null)} disabled={deleteCourseBusy}>Cancel</Button>
            <Button onClick={confirmDeleteCourse} disabled={deleteCourseBusy}>
              {deleteCourseBusy ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />} Delete Course
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-error/30 bg-error/10">
              <AlertTriangle className="text-error-soft" size={20} />
            </span>
            <div>
              <p className="font-display text-lg text-snow">Are you sure?</p>
              <p className="mt-1 text-sm text-snow-dim">
                Deleting <strong className="text-snow">{deletingCourse?.title}</strong> will permanently remove all its sections, lessons, videos, and files. This cannot be undone.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete video modal */}
      <Modal
        open={!!deletingVideo}
        onClose={() => setDeletingVideo(null)}
        title="Delete Video"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingVideo(null)} disabled={deleteVideoBusy}>Cancel</Button>
            <Button onClick={confirmDeleteVideo} disabled={deleteVideoBusy}>
              {deleteVideoBusy ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />} Delete Video
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-error/30 bg-error/10">
              <AlertTriangle className="text-error-soft" size={20} />
            </span>
            <div>
              <p className="font-display text-lg text-snow">Are you sure?</p>
              <p className="mt-1 text-sm text-snow-dim">
                Deleting <strong className="text-snow">{deletingVideo?.title}</strong> will permanently remove this video from the library. This cannot be undone.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function VideoPlayerModal({ video, onClose }: { video: VideoLibraryItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
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
            {video.description && <p className="mt-1 text-sm leading-relaxed text-snow-dim">{video.description}</p>}
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-snow-dim transition-colors hover:bg-white/5 hover:text-snow" aria-label="Close">
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
                  <a href={video.resource_pdf_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm font-semibold text-gold-soft transition-all duration-200 hover:border-gold/50 hover:bg-gold/20 hover:shadow-gold-glow">
                    <FileText size={16} /> Download PDF
                  </a>
                )}
                {video.templates_zip_url && (
                  <a href={video.templates_zip_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-hotpink/30 bg-hotpink/10 px-4 py-2.5 text-sm font-semibold text-hotpink-soft transition-all duration-200 hover:border-hotpink/50 hover:bg-hotpink/20 hover:shadow-glow">
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
