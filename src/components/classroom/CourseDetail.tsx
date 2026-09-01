import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  FileText,
  Plus,
  Paperclip,
  PlayCircle,
  X,
  Check,
  Download,
  Pencil,
  Lock,
  DollarSign,
  Image as ImageIcon,
  ChevronDown,
  PanelLeft,
  Upload,
  Film,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadWithTus } from '@/lib/tusUpload';
import { useAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import type { CourseWithSections, Lesson, SectionWithLessons } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LessonEditor } from '@/components/classroom/LessonEditor';
import { fetchVimeoThumbnail } from '@/lib/vimeo';

interface CourseDetailProps {
  courseId: string;
  onBack: () => void;
}

type InlineAdd = null | 'section' | 'lesson' | 'video' | 'price';

function toEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const idMatch = trimmed.match(/player\.vimeo\.com\/video\/(\d+)/) || trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (idMatch) return `https://player.vimeo.com/video/${idMatch[1]}`;
  return null;
}

export function CourseDetail({ courseId, onBack }: CourseDetailProps) {
  const { profile, user } = useAuth();
  const canManage = hasPermission(profile, 'manage_content');
  const [course, setCourse] = useState<CourseWithSections | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);

  const [inlineAdd, setInlineAdd] = useState<InlineAdd>(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonSection, setNewLessonSection] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingBody, setEditingBody] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [bodyDraft, setBodyDraft] = useState('');

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
  const [videoUploadStatus, setVideoUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: c }, { data: sections }, { data: purchase }] = await Promise.all([
        supabase.from('courses').select('*').eq('id', courseId).maybeSingle(),
        supabase.from('sections').select('*').eq('course_id', courseId).order('position', { ascending: true }),
        supabase.from('course_purchases').select('id').eq('course_id', courseId).eq('user_id', user?.id ?? '').maybeSingle(),
      ]);

      if (cancelled) return;
      setHasPurchased(Boolean(purchase));

      let sectionsWithLessons: SectionWithLessons[] = [];
      if (sections && sections.length > 0) {
        const ids = sections.map((s) => s.id);
        const { data: lessons } = await supabase
          .from('lessons')
          .select('*')
          .in('section_id', ids)
          .order('position', { ascending: true });

        sectionsWithLessons = (sections as SectionWithLessons[]).map((s) => ({
          ...s,
          lessons: (lessons ?? []).filter((l) => l.section_id === s.id),
        }));
      }

      if (cancelled) return;

      if (c) {
        const full: CourseWithSections = { ...(c as CourseWithSections), sections: sectionsWithLessons };
        setCourse(full);
        const first = sectionsWithLessons.flatMap((s) => s.lessons)[0];
        setActiveLesson(first ?? null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, user?.id]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  const refreshCourse = async () => {
    const [{ data: c }, { data: sections }] = await Promise.all([
      supabase.from('courses').select('*').eq('id', courseId).maybeSingle(),
      supabase.from('sections').select('*').eq('course_id', courseId).order('position', { ascending: true }),
    ]);
    let sectionsWithLessons: SectionWithLessons[] = [];
    if (sections && sections.length > 0) {
      const ids = sections.map((s) => s.id);
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .in('section_id', ids)
        .order('position', { ascending: true });
      sectionsWithLessons = (sections as SectionWithLessons[]).map((s) => ({
        ...s,
        lessons: (lessons ?? []).filter((l) => l.section_id === s.id),
      }));
    }
    if (c) {
      const full: CourseWithSections = { ...(c as CourseWithSections), sections: sectionsWithLessons };
      setCourse(full);
      if (activeLesson) {
        const updated = sectionsWithLessons.flatMap((s) => s.lessons).find((l) => l.id === activeLesson.id);
        setActiveLesson(updated ?? null);
      }
    }
  };

  const addSection = async () => {
    if (!newSectionTitle.trim()) return;
    setSaving(true);
    setError(null);
    const { data, error } = await supabase
      .from('sections')
      .insert({ title: newSectionTitle.trim(), course_id: courseId })
      .select()
      .maybeSingle();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNewSectionTitle('');
    setInlineAdd(null);
    if (course && data) {
      setCourse({ ...course, sections: [...course.sections, { ...(data as SectionWithLessons), lessons: [] }] });
    }
  };

  const addLesson = async () => {
    if (!newLessonTitle.trim() || !newLessonSection) return;
    setSaving(true);
    setError(null);
    const { data, error } = await supabase
      .from('lessons')
      .insert({ title: newLessonTitle.trim(), section_id: newLessonSection })
      .select()
      .maybeSingle();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNewLessonTitle('');
    setNewLessonSection('');
    setInlineAdd(null);
    await refreshCourse();
    if (data) setActiveLesson(data as Lesson);
  };

  const onPickPdf = () => fileInputRef.current?.click();

  const onPdfChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeLesson) return;
    setUploading(true);
    setError(null);
    const ext = file.name.split('.').pop() || 'pdf';
    const path = `${activeLesson.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('lesson-files').upload(path, file, {
      contentType: file.type || 'application/pdf',
      upsert: false,
    });
    if (upErr) {
      setUploading(false);
      setError(upErr.message);
      e.target.value = '';
      return;
    }
    const { data: pub } = supabase.storage.from('lesson-files').getPublicUrl(path);
    const { error: updErr } = await supabase
      .from('lessons')
      .update({ pdf_url: pub.publicUrl })
      .eq('id', activeLesson.id);
    setUploading(false);
    e.target.value = '';
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setActiveLesson({ ...activeLesson, pdf_url: pub.publicUrl });
    await refreshCourse();
  };

  const addVideo = async () => {
    if (!newVideoUrl.trim() || !activeLesson) return;
    const embed = toEmbedUrl(newVideoUrl.trim());
    if (!embed) {
      setError('Please paste a valid Vimeo link or embed code.');
      return;
    }
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('lessons')
      .update({ video_url: embed })
      .eq('id', activeLesson.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setActiveLesson({ ...activeLesson, video_url: embed });
    setNewVideoUrl('');
    setInlineAdd(null);
    await refreshCourse();
    fetchVimeoThumbnail(embed).then((o) => {
      if (o?.thumbnail_url) {
        supabase.from('lessons').update({ image_url: o.thumbnail_url }).eq('id', activeLesson.id).then(() => refreshCourse());
      }
    });
  };

  const onPickVideo = () => videoInputRef.current?.click();

  const onVideoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeLesson) return;
    setError(null);
    setVideoUploadProgress(0);
    setVideoUploadStatus(null);
    const safeName = file.name.replace(/\s+/g, '_');
    const path = `${activeLesson.id}/${Date.now()}-${safeName}`;
    try {
      const { publicUrl } = await uploadWithTus({
        bucketId: 'lesson-files',
        path,
        file,
        contentType: file.type || 'video/mp4',
        compress: false,
        onProgress: (pct) => setVideoUploadProgress(pct),
        onStatus: (msg) => setVideoUploadStatus(msg),
      });
      const { error: updErr } = await supabase
        .from('lessons')
        .update({ video_url: publicUrl })
        .eq('id', activeLesson.id);
      setVideoUploadProgress(null);
      setVideoUploadStatus(null);
      e.target.value = '';
      if (updErr) {
        setError(updErr.message);
        return;
      }
      setActiveLesson({ ...activeLesson, video_url: publicUrl });
      await refreshCourse();
    } catch (err) {
      setVideoUploadProgress(null);
      setVideoUploadStatus(null);
      e.target.value = '';
      setError(err instanceof Error ? err.message : 'Video upload failed.');
    }
  };

  const removePdf = async () => {
    if (!activeLesson?.pdf_url) return;
    const { error } = await supabase.from('lessons').update({ pdf_url: null }).eq('id', activeLesson.id);
    if (error) {
      setError(error.message);
      return;
    }
    setActiveLesson({ ...activeLesson, pdf_url: null });
    await refreshCourse();
  };

  const onPickImage = () => imageInputRef.current?.click();

  const onImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeLesson) return;
    setUploading(true);
    setError(null);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${activeLesson.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('lesson-files').upload(path, file, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    });
    if (upErr) {
      setUploading(false);
      setError(upErr.message);
      e.target.value = '';
      return;
    }
    const { data: pub } = supabase.storage.from('lesson-files').getPublicUrl(path);
    const { error: updErr } = await supabase
      .from('lessons')
      .update({ image_url: pub.publicUrl })
      .eq('id', activeLesson.id);
    setUploading(false);
    e.target.value = '';
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setActiveLesson({ ...activeLesson, image_url: pub.publicUrl });
    await refreshCourse();
  };

  const removeImage = async () => {
    if (!activeLesson?.image_url) return;
    const { error } = await supabase.from('lessons').update({ image_url: null }).eq('id', activeLesson.id);
    if (error) {
      setError(error.message);
      return;
    }
    setActiveLesson({ ...activeLesson, image_url: null });
    await refreshCourse();
  };

  const removeVideo = async () => {
    if (!activeLesson?.video_url) return;
    const { error } = await supabase.from('lessons').update({ video_url: null }).eq('id', activeLesson.id);
    if (error) {
      setError(error.message);
      return;
    }
    setActiveLesson({ ...activeLesson, video_url: null });
    await refreshCourse();
  };

  const publishLesson = async () => {
    if (!activeLesson) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from('lessons').update({ published: true }).eq('id', activeLesson.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setActiveLesson({ ...activeLesson, published: true });
    await refreshCourse();
  };

  const unpublishLesson = async () => {
    if (!activeLesson) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from('lessons').update({ published: false }).eq('id', activeLesson.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setActiveLesson({ ...activeLesson, published: false });
    await refreshCourse();
  };

  const saveTitle = async () => {
    if (!activeLesson || !titleDraft.trim()) {
      setEditingTitle(false);
      return;
    }
    if (titleDraft.trim() === activeLesson.title) {
      setEditingTitle(false);
      return;
    }
    const { error } = await supabase.from('lessons').update({ title: titleDraft.trim() }).eq('id', activeLesson.id);
    setEditingTitle(false);
    if (error) {
      setError(error.message);
      return;
    }
    setActiveLesson({ ...activeLesson, title: titleDraft.trim() });
    await refreshCourse();
  };

  const saveBody = async () => {
    if (!activeLesson) return;
    if (bodyDraft === (activeLesson.body ?? '')) {
      setEditingBody(false);
      return;
    }
    const { error } = await supabase.from('lessons').update({ body: bodyDraft }).eq('id', activeLesson.id);
    setEditingBody(false);
    if (error) {
      setError(error.message);
      return;
    }
    setActiveLesson({ ...activeLesson, body: bodyDraft });
    await refreshCourse();
  };

  const isPaid = (course?.price ?? 0) > 0;
  const isLocked = isPaid && !hasPurchased && !canManage;
  const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}`;

  const startCheckout = async () => {
    if (!course) return;
    setCheckingOut(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please sign in to purchase a course.');
        setCheckingOut(false);
        return;
      }
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to start checkout.');
        setCheckingOut(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setCheckingOut(false);
    }
  };

  const savePrice = async () => {
    if (!course) return;
    const priceDollars = parseFloat(newPrice);
    const priceCents = isNaN(priceDollars) || priceDollars < 0 ? 0 : Math.round(priceDollars * 100);
    setSaving(true);
    setError(null);
    const { error } = await supabase.from('courses').update({ price: priceCents }).eq('id', courseId);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setCourse({ ...course, price: priceCents });
    setInlineAdd(null);
    setNewPrice('');
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-snow-dim">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <BookOpen className="text-hotpink/50" size={32} />
        <p className="font-display text-xl text-snow">Course not found</p>
        <button onClick={onBack} className="text-sm text-gold-soft hover:underline">
          Back to Classroom
        </button>
      </div>
    );
  }

  const hasSections = course.sections.length > 0;
  const embedUrl = activeLesson?.video_url
    ? (() => {
        const v = activeLesson.video_url!;
        // Vimeo: convert to embed URL
        const vimeoMatch =
          v.match(/vimeo\.com\/(?:video\/)?(\d+)/) ||
          v.match(/player\.vimeo\.com\/video\/(\d+)/);
        if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        if (/^https?:\/\/player\.vimeo\.com\/video\/\d+/.test(v)) return v.split('?')[0];
        return null; // direct file — use <video> tag
      })()
    : null;
  const isDirectVideo = activeLesson?.video_url && !embedUrl;

  if (isLocked) {
    return (
      <div className="animate-fade-in">
        <button
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 text-sm text-snow-dim transition-colors hover:text-gold-soft"
        >
          <ArrowLeft size={16} /> Back to Classroom
        </button>
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-pinkline bg-ink-100/60 py-20 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-pinkline bg-ink-100 shadow-glow">
            <Lock className="text-hotpink" size={28} />
          </span>
          <div>
            <h1 className="font-display text-3xl text-snow">{course.title}</h1>
            <p className="mt-2 text-sm text-snow-dim">This is a premium course. Unlock it with a one-time payment.</p>
          </div>
          {error && (
            <div className="max-w-md rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error-soft">
              {error}
            </div>
          )}
          <Button size="lg" onClick={startCheckout} disabled={checkingOut}>
            {checkingOut ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
            Unlock — {formatPrice(course.price!)}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in -m-4 lg:-m-6 h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={onPdfChange} />
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onImageChange} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={onVideoChange} />

      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-pinkline bg-ink-100/80 px-4 py-3 backdrop-blur-sm lg:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-pinkline bg-ink-50 text-snow-dim transition-colors hover:text-gold-soft"
            title="Back to Classroom"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg text-snow">{course.title}</h1>
            <p className="text-xs text-snow-dim">
              {course.sections.length} section{course.sections.length !== 1 ? 's' : ''}
              {isPaid && <span className="ml-1.5 text-gold-soft">· {formatPrice(course.price!)}</span>}
            </p>
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button variant="subtle" size="sm" onClick={() => { setInlineAdd(inlineAdd === 'price' ? null : 'price'); setNewPrice(course.price ? (course.price / 100).toFixed(2) : ''); }}>
              <DollarSign size={14} /> {isPaid ? 'Edit' : 'Price'}
            </Button>
          </div>
        )}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-pinkline bg-ink-50 text-snow-dim transition-colors hover:text-snow lg:hidden"
          title="Toggle lesson list"
        >
          <PanelLeft size={18} />
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between border-b border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error-soft lg:px-6">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-error-soft/70 hover:text-error-soft">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Inline add bars */}
      {inlineAdd === 'price' && (
        <div className="flex flex-col gap-2 border-b border-pinkline bg-ink-50 px-4 py-3 lg:px-6">
          <label className="text-xs font-medium uppercase tracking-wider text-snow-dim">Price (USD)</label>
          <div className="flex items-center gap-2">
            <div className="relative w-40">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-snow-dim">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-pinkline bg-ink-50 px-4 py-2.5 pl-8 text-snow placeholder:text-snow-dim/60 focus:border-hotpink/50 focus:outline-none"
              />
            </div>
            <p className="flex-1 text-xs text-snow-dim/70">0 or blank = free with membership.</p>
            <Button variant="ghost" size="sm" onClick={() => setInlineAdd(null)}>Cancel</Button>
            <Button size="sm" onClick={savePrice} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Save
            </Button>
          </div>
        </div>
      )}

      {inlineAdd === 'section' && (
        <div className="flex items-center gap-2 border-b border-pinkline bg-ink-50 px-4 py-3 lg:px-6">
          <input
            name="new_section"
            placeholder="Section title (e.g. Foundations)"
            autoFocus
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addSection();
              if (e.key === 'Escape') setInlineAdd(null);
            }}
            className="flex-1 rounded-xl border border-pinkline bg-ink-50 px-4 py-2.5 text-snow placeholder:text-snow-dim/60 focus:border-hotpink/50 focus:outline-none focus:shadow-glow"
          />
          <Button variant="ghost" size="sm" onClick={() => setInlineAdd(null)}>Cancel</Button>
          <Button size="sm" onClick={addSection} disabled={saving || !newSectionTitle.trim()}>
            {saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />} Add Section
          </Button>
        </div>
      )}

      {inlineAdd === 'lesson' && (
        <div className="flex flex-col gap-2 border-b border-pinkline bg-ink-50 px-4 py-3 lg:px-6 sm:flex-row sm:items-center">
          <input
            name="new_lesson"
            placeholder="Lesson title (e.g. Threading the needle)"
            autoFocus
            value={newLessonTitle}
            onChange={(e) => setNewLessonTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addLesson();
              if (e.key === 'Escape') setInlineAdd(null);
            }}
            className="flex-1 rounded-xl border border-pinkline bg-ink-50 px-4 py-2.5 text-snow placeholder:text-snow-dim/60 focus:border-hotpink/50 focus:outline-none focus:shadow-glow"
          />
          <select
            value={newLessonSection}
            onChange={(e) => setNewLessonSection(e.target.value)}
            className="rounded-xl border border-pinkline bg-ink-50 px-4 py-3 text-sm text-snow focus:border-hotpink/50 focus:outline-none"
          >
            {course.sections.map((s) => (
              <option key={s.id} value={s.id} className="bg-ink-100">
                {s.title}
              </option>
            ))}
          </select>
          <Button variant="ghost" size="sm" onClick={() => setInlineAdd(null)}>Cancel</Button>
          <Button size="sm" onClick={addLesson} disabled={saving || !newLessonTitle.trim() || !newLessonSection}>
            {saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />} Add Lesson
          </Button>
        </div>
      )}

      {inlineAdd === 'video' && activeLesson && (
        <div className="flex flex-col gap-2 border-b border-pinkline bg-ink-50 px-4 py-3 lg:px-6 sm:flex-row sm:items-center">
          <input
            name="new_video"
            placeholder="Paste Vimeo URL or full embed code"
            autoFocus
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addVideo();
              if (e.key === 'Escape') setInlineAdd(null);
            }}
            className="flex-1 rounded-xl border border-pinkline bg-ink-50 px-4 py-2.5 text-snow placeholder:text-snow-dim/60 focus:border-hotpink/50 focus:outline-none focus:shadow-glow"
          />
          <Button variant="ghost" size="sm" onClick={() => setInlineAdd(null)}>Cancel</Button>
          <Button size="sm" onClick={addVideo} disabled={saving || !newVideoUrl.trim()}>
            {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Save Video
          </Button>
        </div>
      )}

      {/* Main split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Left sidebar — lesson list */}
        <aside className={`absolute inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-pinkline bg-ink-100 transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {canManage && (
            <div className="flex items-center gap-1.5 border-b border-pinkline px-3 py-2.5">
              <Button variant="subtle" size="sm" onClick={() => { setInlineAdd(inlineAdd === 'section' ? null : 'section'); setNewSectionTitle(''); }} className="flex-1 justify-center">
                <Plus size={13} /> Section
              </Button>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => {
                  setInlineAdd(inlineAdd === 'lesson' ? null : 'lesson');
                  setNewLessonTitle('');
                  setNewLessonSection(course.sections[0]?.id ?? '');
                }}
                disabled={!hasSections}
                className="flex-1 justify-center"
              >
                <Plus size={13} /> Lesson
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3">
            {!hasSections ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
                <BookOpen className="text-snow-dim/40" size={28} />
                <p className="text-sm text-snow-dim">No sections yet</p>
                {canManage && <p className="text-xs text-snow-dim/70">Use the buttons above to add one.</p>}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {course.sections.map((section) => {
                  const isCollapsed = collapsedSections.has(section.id);
                  return (
                    <div key={section.id}>
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5"
                      >
                        <span className="truncate font-display text-xs font-bold uppercase tracking-widest text-hotpink">
                          {section.title}
                        </span>
                        <ChevronDown
                          size={14}
                          className={`shrink-0 text-snow-dim transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
                        />
                      </button>
                      {!isCollapsed && (
                        <div className="mt-1 flex flex-col gap-0.5">
                          {section.lessons.length === 0 && (
                            <p className="px-3 py-1.5 text-xs text-snow-dim/70">No lessons</p>
                          )}
                          {section.lessons.map((lesson) => {
                            const isActive = activeLesson?.id === lesson.id;
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => { setActiveLesson(lesson); setSidebarOpen(false); }}
                                className={`group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 ${
                                  isActive
                                    ? 'bg-hotpink/10 text-snow ring-1 ring-hotpink/30'
                                    : 'text-snow-muted hover:bg-white/5 hover:text-snow'
                                }`}
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <FileText
                                    size={14}
                                    className={isActive ? 'text-hotpink' : 'text-snow-dim group-hover:text-snow-muted'}
                                  />
                                  <span className="truncate">{lesson.title}</span>
                                </span>
                                {!lesson.published && <Badge tone="draft">Draft</Badge>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Right panel — lesson content */}
        <section className="flex-1 overflow-y-auto scrollbar-thin bg-ink-50/30 pb-[env(safe-area-inset-bottom)]">
          {activeLesson ? (
            <article className="animate-fade-in mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
              {/* Lesson header */}
              <div className="mb-6 flex items-center gap-3">
                {editingTitle ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      ref={titleInputRef}
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onBlur={saveTitle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTitle();
                        if (e.key === 'Escape') setEditingTitle(false);
                      }}
                      className="flex-1 rounded-xl border border-hotpink/40 bg-ink-50 px-4 py-2.5 font-display text-2xl text-snow focus:outline-none focus:shadow-glow"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-2xl text-snow">
                      {activeLesson.title}
                    </h2>
                    {canManage && (
                      <button
                        onClick={() => {
                          setTitleDraft(activeLesson.title);
                          setEditingTitle(true);
                        }}
                        className="group flex items-center gap-2 text-left"
                      >
                        <Pencil size={15} className="text-snow-dim opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    )}
                  </div>
                )}
                {!activeLesson.published && <Badge tone="draft">Draft</Badge>}
              </div>

              {/* Editable body */}
              <div className="mb-6">
                {editingBody ? (
                  <div className="flex flex-col gap-2">
                    <LessonEditor
                      value={bodyDraft}
                      onChange={setBodyDraft}
                      onSave={saveBody}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-snow-dim">Ctrl+Enter to save · Esc to cancel</span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingBody(false)}>Cancel</Button>
                        <Button size="sm" onClick={saveBody}>
                          <Check size={14} /> Save content
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  canManage ? (
                  <button
                    onClick={() => {
                      setBodyDraft(activeLesson.body ?? '');
                      setEditingBody(true);
                    }}
                    className="group w-full rounded-xl border border-transparent px-4 py-3 text-left transition-colors hover:border-pinkline hover:bg-ink-50/50"
                  >
                    {activeLesson.body ? (
                      <div
                        className="prose-lesson leading-relaxed text-snow-muted"
                        dangerouslySetInnerHTML={{ __html: activeLesson.body }}
                      />
                    ) : (
                      <p className="italic text-snow-dim">Click to add lesson content…</p>
                    )}
                    <span className="mt-2 flex items-center gap-1.5 text-xs text-snow-dim opacity-0 transition-opacity group-hover:opacity-100">
                      <Pencil size={12} /> Click to edit
                    </span>
                  </button>
                  ) : (
                    activeLesson.body ? (
                      <div
                        className="prose-lesson leading-relaxed text-snow-muted"
                        dangerouslySetInnerHTML={{ __html: activeLesson.body }}
                      />
                    ) : (
                      <p className="italic text-snow-dim/60">No written content for this lesson.</p>
                    )
                  )
                )}
              </div>

              {/* Admin toolbar */}
              {canManage && (
                <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-pinkline bg-ink-100/50 px-4 py-3">
                  <span className="mr-auto text-xs font-semibold uppercase tracking-widest text-snow-dim">Lesson tools</span>
                  <Button variant="subtle" size="sm" onClick={onPickPdf} disabled={uploading}>
                    {uploading ? <Loader2 className="animate-spin" size={14} /> : <Paperclip size={14} />} PDF
                  </Button>
                  <Button variant="subtle" size="sm" onClick={onPickImage} disabled={uploading}>
                    {uploading ? <Loader2 className="animate-spin" size={14} /> : <ImageIcon size={14} />} Photo
                  </Button>
                  <Button variant="subtle" size="sm" onClick={onPickVideo} disabled={uploading || videoUploadProgress !== null}>
                    {videoUploadProgress !== null ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />} Upload MP4
                  </Button>
                  <Button variant="subtle" size="sm" onClick={() => { setInlineAdd(inlineAdd === 'video' ? null : 'video'); setNewVideoUrl(''); }}>
                    <PlayCircle size={14} /> Vimeo
                  </Button>
                  <div className="mx-1 h-5 w-px bg-pinkline" />
                  {activeLesson.published ? (
                    <>
                      <Badge tone="success">Published</Badge>
                      <Button variant="subtle" size="sm" onClick={unpublishLesson} disabled={saving}>
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Lock size={14} />} Unpublish
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={publishLesson} disabled={saving}>
                      {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Publish
                    </Button>
                  )}
                </div>
              )}

              {/* Video upload progress bar */}
              {videoUploadProgress !== null && (
                <div className="mb-4 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3">
                  <div className="mb-2 flex items-center gap-2 text-sm text-snow">
                    <Film size={15} className="text-gold-soft" />
                    <span>{videoUploadStatus || `Uploading video…`} {videoUploadProgress > 0 ? `${videoUploadProgress}%` : ''}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-ink-200">
                    <div
                      className="h-full rounded-full bg-gold transition-all duration-300"
                      style={{ width: `${videoUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Attached media */}
              {(activeLesson.pdf_url || activeLesson.video_url || activeLesson.image_url) && (
                <div className="flex flex-col gap-5 border-t border-pinkline pt-6">
                  {activeLesson.image_url && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-widest text-snow-dim">Photo</p>
                        {canManage && (
                          <button onClick={removeImage} className="text-snow-dim hover:text-error-soft" title="Remove">
                            <X size={15} />
                          </button>
                        )}
                      </div>
                      <img
                        src={activeLesson.image_url}
                        alt="Lesson"
                        className="w-full rounded-xl border border-pinkline object-cover"
                      />
                    </div>
                  )}
                  {activeLesson.pdf_url && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-snow-dim">Attached PDF</p>
                      <div className="inline-flex items-center gap-3 rounded-xl border border-pinkline bg-ink-50 px-3 py-2">
                        <FileText size={16} className="text-error-soft" />
                        <a
                          href={activeLesson.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-sm text-snow hover:text-gold-soft"
                        >
                          <Download size={14} /> Download PDF
                        </a>
                        {canManage && (
                          <button onClick={removePdf} className="text-snow-dim hover:text-error-soft" title="Remove">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                      {activeLesson.video_url && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-widest text-snow-dim">Video</p>
                        {canManage && (
                          <button onClick={removeVideo} className="text-snow-dim hover:text-error-soft" title="Remove">
                            <X size={15} />
                          </button>
                        )}
                      </div>
                      {embedUrl ? (
                        <div className="overflow-hidden rounded-xl border border-pinkline bg-black">
                          <div className="relative aspect-video w-full">
                            <iframe
                              src={embedUrl}
                              title="Lesson video"
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowFullScreen
                              className="absolute inset-0 h-full w-full"
                            />
                          </div>
                        </div>
                      ) : isDirectVideo ? (
                        <div className="overflow-hidden rounded-xl border border-pinkline bg-black">
                          <video
                            src={activeLesson.video_url!}
                            controls
                            controlsList="nodownload"
                            onContextMenu={(e) => e.preventDefault()}
                            className="aspect-video w-full"
                            playsInline
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error-soft">
                          <PlayCircle size={16} />
                          Could not embed this video URL.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </article>
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center">
              <FileText className="text-hotpink/40" size={36} />
              <p className="font-display text-xl text-snow">No lesson selected</p>
              <p className="max-w-xs text-sm text-snow-dim">
                Choose a lesson from the sidebar to begin reading{canManage ? ', or add one with the buttons above.' : '.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
