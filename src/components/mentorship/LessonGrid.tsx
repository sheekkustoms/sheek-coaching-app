import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Video,
  Lightbulb,
  Loader2,
  PlayCircle,
  FileText,
  Plus,
  Pencil,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { MentorshipLesson } from '@/lib/types';
import { LessonView } from '@/components/mentorship/LessonView';
import { LessonEditModal } from '@/components/mentorship/LessonEditModal';

const TYPE_ICONS: Record<string, typeof BookOpen> = {
  strategy: BookOpen,
  worksheet: ClipboardList,
  video: Video,
  reflection: Lightbulb,
  tool: Zap,
};

const TYPE_LABELS: Record<string, string> = {
  strategy: 'Strategy',
  worksheet: 'Worksheet',
  video: 'Video Lesson',
  reflection: 'Reflection',
  tool: 'Interactive Tool',
};

const TYPE_COLORS: Record<string, string> = {
  strategy: 'text-gold',
  worksheet: 'text-[#C97A8A]',
  video: 'text-gold',
  reflection: 'text-cream-dim',
  tool: 'text-gold',
};

interface LessonGridProps {
  weekNum: number;
  weekTitle: string;
  weekIntro: string;
  onBack: () => void;
  isAdmin?: boolean;
}

export function LessonGrid({ weekNum, weekTitle, weekIntro, onBack, isAdmin = false }: LessonGridProps) {
  const [lessons, setLessons] = useState<MentorshipLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [openLesson, setOpenLesson] = useState<MentorshipLesson | null>(null);
  const [editingLesson, setEditingLesson] = useState<MentorshipLesson | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mentorship_lessons')
      .select('*')
      .eq('week_number', weekNum)
      .order('position', { ascending: true });
    if (error) {
      console.error('Failed to load lessons:', error.message);
      setLessons([]);
    } else {
      setLessons(data ?? []);
    }
    setLoading(false);
  }, [weekNum]);

  useEffect(() => {
    load();
  }, [load]);

  const onLessonSaved = () => {
    setEditingLesson(null);
    setShowAddModal(false);
    load();
  };

  // --- Lesson detail view ---
  if (openLesson) {
    return (
      <LessonView
        lesson={openLesson}
        weekNum={weekNum}
        weekTitle={weekTitle}
        isAdmin={isAdmin}
        onBack={() => setOpenLesson(null)}
        onLessonUpdated={(updated) => {
          setOpenLesson(updated);
          load();
        }}
      />
    );
  }

  // --- Lesson grid view ---
  return (
    <div className="animate-fade-in" style={{ background: '#18080E' }}>
      <div className="p-6 sm:p-10">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cream-dim transition-colors hover:text-gold"
        >
          <ArrowLeft size={14} /> Back to Classroom
        </button>

        {/* Week header */}
        <div className="mb-8 flex items-start justify-between gap-4 border-b border-gold/10 pb-6">
          <div>
            <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.28em] text-gold">
              Week {weekNum}
            </div>
            <h2 className="font-lux text-3xl font-bold leading-[1.05] sm:text-4xl" style={{ color: '#FBF4EC' }}>
              {weekTitle}
            </h2>
            {weekIntro && (
              <p className="mt-3 max-w-2xl text-[14px] leading-[1.75] text-cream-dim">{weekIntro}</p>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex shrink-0 items-center gap-1.5 border border-gold/30 bg-gold/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gold transition-colors hover:bg-gold/20"
            >
              <Plus size={15} /> Add Lesson
            </button>
          )}
        </div>

        {/* Lesson cards */}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" /> Loading lessons...
          </div>
        ) : lessons.length === 0 ? (
          <div className="border border-gold/9 bg-luxcard p-7 text-[14px] italic text-cream-dim">
            {isAdmin
              ? 'No lessons yet. Click "Add Lesson" to create the first one for this week.'
              : 'Lessons for this week will be added soon.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {lessons.map((lesson, i) => {
              const Icon = TYPE_ICONS[lesson.lesson_type] ?? BookOpen;
              const colorClass = TYPE_COLORS[lesson.lesson_type] ?? 'text-gold';
              const hasVideo = Boolean(lesson.video_url);
              const hasPdf = Boolean(lesson.pdf_url);
              return (
                <div
                  key={lesson.id}
                  className="group relative flex flex-col gap-4 border border-gold/15 bg-luxcard p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_8px_30px_rgba(201,149,58,0.12)]"
                  style={{ background: '#0F0509' }}
                >
                  {/* Lesson number + type */}
                  <div className="flex items-center justify-between">
                    <span className="font-lux text-3xl font-bold leading-none text-gold/25 transition-colors group-hover:text-gold/50">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] ${colorClass}`}>
                      <Icon size={13} /> {TYPE_LABELS[lesson.lesson_type] ?? 'Lesson'}
                    </span>
                  </div>

                  {/* Title */}
                  <button onClick={() => setOpenLesson(lesson)} className="text-left">
                    <h3 className="font-lux text-lg font-semibold leading-snug text-cream transition-colors group-hover:text-gold">
                      {lesson.title}
                    </h3>
                  </button>

                  {/* Subtitle */}
                  {lesson.subtitle && (
                    <p className="text-[12px] leading-[1.6] text-cream-dim">{lesson.subtitle}</p>
                  )}

                  {/* Media indicators */}
                  {(hasVideo || hasPdf) && (
                    <div className="flex items-center gap-3 border-t border-gold/8 pt-3">
                      {hasVideo && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gold">
                          <PlayCircle size={12} /> Video
                        </span>
                      )}
                      {hasPdf && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gold">
                          <FileText size={12} /> PDF
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bullet count preview */}
                  <div className="mt-auto flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                    <span>{(lesson.figure_out ?? []).length} objectives</span>
                    <span>{(lesson.leave_with ?? []).length} takeaways</span>
                  </div>

                  {/* Admin edit button */}
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingLesson(lesson);
                      }}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-gold/20 bg-luxbg/80 text-gold opacity-0 backdrop-blur-sm transition-all hover:bg-gold hover:text-luxbg group-hover:opacity-100"
                      title="Edit lesson"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingLesson && (
        <LessonEditModal
          weekNum={weekNum}
          lesson={editingLesson}
          onClose={() => setEditingLesson(null)}
          onSaved={onLessonSaved}
        />
      )}

      {/* Add modal */}
      {showAddModal && (
        <LessonEditModal
          weekNum={weekNum}
          lesson={null}
          onClose={() => setShowAddModal(false)}
          onSaved={onLessonSaved}
        />
      )}
    </div>
  );
}
