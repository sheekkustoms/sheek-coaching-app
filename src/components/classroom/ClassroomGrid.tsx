import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Plus, Loader2, BookOpen, ImagePlus, X, Lock, DollarSign, FileArchive, Trash2, Pencil, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import type { Course, CoursePurchase, CourseWithSections } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { NewCourseModal } from './NewCourseModal';
import { ZipImportModal } from './ZipImportModal';
import classroomSign from './image copy.png';

interface ClassroomGridProps {
  onOpenCourse: (course: CourseWithSections) => void;
}

export function ClassroomGrid({ onOpenCourse }: ClassroomGridProps) {
  const { profile, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [purchases, setPurchases] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [zipOpen, setZipOpen] = useState(false);
  const [editingThumb, setEditingThumb] = useState<string | null>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canManage = hasPermission(profile, 'manage_content');

  const load = async () => {
    setLoading(true);
    const [coursesRes, purchasesRes] = await Promise.all([
      supabase.from('courses').select('*').order('created_at', { ascending: false }),
      supabase.from('course_purchases').select('course_id'),
    ]);
    if (coursesRes.data) setCourses(coursesRes.data);
    if (purchasesRes.data) {
      setPurchases(new Set((purchasesRes.data as CoursePurchase[]).map((p) => p.course_id)));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onPickThumb = (courseId: string) => {
    setEditingThumb(courseId);
    fileRef.current?.click();
  };

  const onThumbChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingThumb) return;
    setUploadingThumb(true);
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${editingThumb}/thumb.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('course-thumbnails')
      .upload(path, file, { upsert: true });
    if (upErr) {
      setUploadingThumb(false);
      setError(upErr.message);
      setEditingThumb(null);
      e.target.value = '';
      return;
    }
    const { data: pub } = supabase.storage.from('course-thumbnails').getPublicUrl(path);
    const url = pub.publicUrl + `?t=${Date.now()}`;
    const { error: updErr } = await supabase
      .from('courses')
      .update({ thumbnail_url: url })
      .eq('id', editingThumb);
    setUploadingThumb(false);
    setEditingThumb(null);
    e.target.value = '';
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setCourses((cur) =>
      cur.map((c) => (c.id === editingThumb ? { ...c, thumbnail_url: url } : c)),
    );
  };

  const removeThumb = async (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (course?.thumbnail_url) {
      const ext = course.thumbnail_url.split('/').pop()?.split('?')[0]?.split('.').pop() || 'jpg';
      const path = `${courseId}/thumb.${ext}`;
      await supabase.storage.from('course-thumbnails').remove([path]);
    }
    const { error } = await supabase
      .from('courses')
      .update({ thumbnail_url: null })
      .eq('id', courseId);
    if (error) {
      setError(error.message);
      return;
    }
    setCourses((cur) =>
      cur.map((c) => (c.id === courseId ? { ...c, thumbnail_url: null } : c)),
    );
  };

  const startCheckout = async (courseId: string) => {
    setCheckingOut(courseId);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please sign in to purchase a course.');
        setCheckingOut(null);
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
        setCheckingOut(null);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setCheckingOut(null);
    }
  };

  const isPaid = (course: Course) => (course.price ?? 0) > 0;
  const isLocked = (course: Course) => isPaid(course) && !purchases.has(course.id) && !canManage;
  const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}`;

  const confirmDelete = async () => {
    if (!deletingCourse) return;
    setDeleteBusy(true);
    setError(null);
    if (deletingCourse.thumbnail_url) {
      const ext = deletingCourse.thumbnail_url.split('/').pop()?.split('?')[0]?.split('.').pop() || 'jpg';
      await supabase.storage.from('course-thumbnails').remove([`${deletingCourse.id}/thumb.${ext}`]);
    }
    const { error: delErr } = await supabase.from('courses').delete().eq('id', deletingCourse.id);
    setDeleteBusy(false);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    setDeletingCourse(null);
    load();
  };

  return (
    <div className="animate-fade-in">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onThumbChange} />

      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl text-snow">Classroom</h1>
          <p className="mt-1 text-sm text-snow-dim">Your atelier of courses, sections, and lessons.</p>
        </div>
      </div>

      <section className="mb-8 overflow-hidden rounded-2xl border border-gold/25 bg-ink-100/70 shadow-glow">
        <img
          src={classroomSign}
          alt="Welcome to the Classroom — browse courses, watch lessons, and level up your craft."
          className="h-auto w-full object-cover"
        />
        <div className="border-t border-gold/15 px-5 py-4 text-center sm:px-8">
          <p className="font-display text-lg text-gold-soft sm:text-xl">Keep showing up — every lesson brings you closer to your next level.</p>
          <p className="mt-1 text-sm leading-6 text-snow-dim">Take it one course, one lesson, and one brave step at a time. You are building something remarkable.</p>
        </div>
      </section>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error-soft">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-error-soft/70 hover:text-error-soft">
            <X size={15} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center text-snow-dim">
          <Loader2 className="animate-spin" size={24} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const locked = isLocked(course);
            const paid = isPaid(course);
            return (
              <div
                key={course.id}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-ink-100 text-left transition-all duration-300 ${
                  locked
                    ? 'border-pinkline/60'
                    : 'border-pinkline hover:-translate-y-1 hover:shadow-glow-strong hover:border-hotpink/40'
                }`}
              >
                <button
                  onClick={() => !locked && onOpenCourse({ ...course, sections: [] })}
                  className={`relative block h-36 overflow-hidden ${locked ? 'cursor-pointer' : ''}`}
                >
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className={`h-full w-full object-cover transition-transform duration-500 ${
                        locked ? 'opacity-40 grayscale' : 'group-hover:scale-105'
                      }`}
                    />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-hotpink/30 via-ink-100 to-gold/20 ${locked ? 'opacity-40' : ''}`}>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,20,147,0.25),transparent_60%)]" />
                      <span className="relative font-display text-lg leading-snug text-snow/95 text-balance text-center drop-shadow-md px-4">
                        {course.title}
                      </span>
                    </div>
                  )}
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <Badge tone="draft">Draft</Badge>
                    {paid && !locked && (
                      <Badge tone="gold">Owned</Badge>
                    )}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onPickThumb(course.id);
                      }}
                      disabled={uploadingThumb && editingThumb === course.id}
                      className="rounded-lg bg-ink/80 p-1.5 text-snow backdrop-blur-sm transition-colors hover:bg-hotpink hover:text-snow"
                      title="Upload thumbnail"
                    >
                      {uploadingThumb && editingThumb === course.id ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <ImagePlus size={14} />
                      )}
                    </button>
                    {course.thumbnail_url && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeThumb(course.id);
                        }}
                        className="rounded-lg bg-ink/80 p-1.5 text-snow backdrop-blur-sm transition-colors hover:bg-error hover:text-snow"
                        title="Remove thumbnail"
                      >
                        <X size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCourse(course);
                      }}
                      className="rounded-lg bg-ink/80 p-1.5 text-snow backdrop-blur-sm transition-colors hover:bg-gold hover:text-ink"
                      title="Edit course"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingCourse(course);
                      }}
                      className="rounded-lg bg-ink/80 p-1.5 text-snow backdrop-blur-sm transition-colors hover:bg-error hover:text-snow"
                      title="Delete course"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <h3 className="font-display text-lg text-snow group-hover:text-hotpink-soft transition-colors">
                    {course.title}
                  </h3>
                  <div className="mt-auto">
                    {locked ? (
                      <button
                        onClick={() => startCheckout(course.id)}
                        disabled={checkingOut === course.id}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-hotpink/40 bg-hotpink/10 px-4 py-2.5 text-sm font-semibold text-hotpink-soft transition-all duration-200 hover:border-hotpink/60 hover:bg-hotpink/20 hover:shadow-glow"
                      >
                        {checkingOut === course.id ? (
                          <Loader2 className="animate-spin" size={15} />
                        ) : (
                          <Lock size={15} />
                        )}
                        Unlock — {formatPrice(course.price!)}
                      </button>
                    ) : paid && !canManage ? (
                      <>
                        <div className="mb-1.5 flex items-center justify-between text-xs text-snow-dim">
                          <span>Progress</span>
                          <span>0%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                          <div className="h-full rounded-full bg-gradient-to-r from-gold-deep to-hotpink" style={{ width: '0%' }} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mb-1.5 flex items-center justify-between text-xs text-snow-dim">
                          <span>Progress</span>
                          <span>0%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                          <div className="h-full rounded-full bg-gradient-to-r from-gold-deep to-hotpink" style={{ width: '0%' }} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {canManage && (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setModalOpen(true)}
                className="group flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-pinkline bg-ink-50/50 text-snow-dim transition-all duration-300 hover:border-hotpink/40 hover:text-hotpink-soft hover:shadow-glow"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-pinkline bg-ink-100 transition-transform duration-300 group-hover:scale-110">
                  <Plus size={20} />
                </span>
                <span className="font-display text-base">New Course</span>
                <span className="text-xs">Create manually</span>
              </button>
              <button
                onClick={() => setZipOpen(true)}
                className="group flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-pinkline bg-ink-50/50 text-snow-dim transition-all duration-300 hover:border-gold/40 hover:text-gold-soft hover:shadow-glow"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-pinkline bg-ink-100 transition-transform duration-300 group-hover:scale-110">
                  <FileArchive size={20} />
                </span>
                <span className="font-display text-base">Import Zip</span>
                <span className="text-xs">Auto-create from zip</span>
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && courses.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-pinkline bg-ink-100/50 py-20 text-center">
          <BookOpen className="text-hotpink/50" size={32} />
          <p className="font-display text-xl text-snow">No courses yet</p>
          <p className="text-sm text-snow-dim">Create your first course to begin.</p>
        </div>
      )}

      <NewCourseModal
        open={modalOpen || !!editingCourse}
        editingCourse={editingCourse}
        onClose={() => { setModalOpen(false); setEditingCourse(null); }}
        onCreated={load}
      />
      <ZipImportModal
        open={zipOpen}
        onClose={() => setZipOpen(false)}
        onCreated={load}
      />
      <Modal
        open={!!deletingCourse}
        onClose={() => setDeletingCourse(null)}
        title="Delete Course"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingCourse(null)} disabled={deleteBusy}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} disabled={deleteBusy}>
              {deleteBusy ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
              Delete Course
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
    </div>
  );
}
