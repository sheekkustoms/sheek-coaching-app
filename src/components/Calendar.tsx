import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  CalendarDays,
  Plus,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MonitorPlay,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { AcademyEvent } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Calendar({ category = 'general' }: { category?: 'general' | 'mentorship' }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<AcademyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', event_date: '', description: '' });
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('category', category)
      .order('event_date', { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setEvents((data ?? []) as AcademyEvent[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.event_date) return;
    setSaving(true);
    setError(null);
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: form.title.trim(),
        event_date: form.event_date,
        description: form.description.trim() || null,
        category,
      })
      .select('*')
      .maybeSingle();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data) {
      setEvents((prev) =>
        [...prev, data as AcademyEvent].sort((a, b) =>
          a.event_date.localeCompare(b.event_date),
        ),
      );
    }
    setForm({ title: '', event_date: '', description: '' });
    setModalOpen(false);
  };

  const onDelete = async (id: string) => {
    const prev = events;
    setEvents((cur) => cur.filter((ev) => ev.id !== id));
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      setEvents(prev);
      setError(error.message);
    }
  };

  const eventsByDate = useMemo(() => {
    const map = new Map<string, AcademyEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.event_date) ?? [];
      list.push(ev);
      map.set(ev.event_date, list);
    }
    return map;
  }, [events]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((ev) => ev.event_date >= today);
  const past = events.filter((ev) => ev.event_date < today);

  const grid = buildMonthGrid(viewMonth);

  const prevMonth = () =>
    setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday = () => {
    const now = new Date();
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-snow">Calendar</h1>
          <p className="mt-1 text-sm text-snow-dim">
            Live workshops, studio hours, and seasonal course drops.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add Event
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error-soft">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center text-snow-dim">
          <Loader2 className="animate-spin" size={22} />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-pinkline bg-ink-100/60 p-5 shadow-glow">
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="rounded-lg p-1.5 text-snow-dim transition-colors hover:bg-white/5 hover:text-snow"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex flex-col items-center">
                <span className="font-display text-lg text-snow">
                  {viewMonth.toLocaleDateString('en-US', { month: 'long' })}
                </span>
                <span className="text-xs text-snow-dim">
                  {viewMonth.getFullYear()}
                </span>
              </div>
              <button
                onClick={nextMonth}
                className="rounded-lg p-1.5 text-snow-dim transition-colors hover:bg-white/5 hover:text-snow"
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-snow-dim"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {grid.map((cell, i) => {
                const dateStr = cell
                  ? `${cell.getFullYear()}-${String(cell.getMonth() + 1).padStart(2, '0')}-${String(cell.getDate()).padStart(2, '0')}`
                  : null;
                const dayEvents = dateStr ? eventsByDate.get(dateStr) ?? [] : [];
                const isToday = dateStr === today;
                const inMonth = cell?.getMonth() === viewMonth.getMonth();
                return (
                  <div
                    key={i}
                    className={`relative flex min-h-[3.25rem] flex-col items-center justify-start rounded-lg border p-1.5 transition-colors ${
                      cell
                        ? 'border-pinkline/40 bg-ink-50/40 hover:border-hotpink/30'
                        : 'border-transparent'
                    } ${inMonth ? '' : 'opacity-30'}`}
                  >
                    {cell && (
                      <span
                        className={`text-xs ${
                          isToday
                            ? 'flex h-5 w-5 items-center justify-center rounded-full bg-hotpink font-semibold text-snow'
                            : 'text-snow-dim'
                        }`}
                      >
                        {cell.getDate()}
                      </span>
                    )}
                    {dayEvents.length > 0 && (
                      <span className="mt-1 flex items-center justify-center">
                        <span className="flex items-center justify-center rounded-md bg-hotpink/15 p-0.5 ring-1 ring-hotpink/40">
                          <MonitorPlay className="text-hotpink-soft" size={13} />
                        </span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-snow-dim">
                <span className="flex items-center justify-center rounded-md bg-hotpink/15 p-0.5 ring-1 ring-hotpink/40">
                  <MonitorPlay className="text-hotpink-soft" size={12} />
                </span>
                <span>Class scheduled</span>
              </div>
              <button
                onClick={goToday}
                className="text-xs font-medium text-gold transition-colors hover:text-gold-soft"
              >
                Today
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-pinkline bg-ink-100/40 py-16 text-center">
                <CalendarDays className="text-hotpink/40" size={32} />
                <p className="font-display text-xl text-snow">No events yet</p>
                <p className="text-sm text-snow-dim">
                  Add your first workshop or studio hour to get started.
                </p>
              </div>
            ) : (
              <>
                <EventSection
                  label="Upcoming"
                  events={upcoming}
                  onDelete={onDelete}
                  ownerId={user?.id}
                />
                {past.length > 0 && (
                  <EventSection
                    label="Past"
                    events={past}
                    onDelete={onDelete}
                    ownerId={user?.id}
                    dimmed
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Event"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onSubmit}
              disabled={saving || !form.title.trim() || !form.event_date}
            >
              {saving ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />}
              Save
            </Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            label="Title"
            name="title"
            placeholder="Workshop title"
            autoFocus
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            label="Date"
            name="event_date"
            type="date"
            required
            value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
          />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="description"
              className="text-xs font-medium uppercase tracking-wider text-snow-dim"
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="What is this event about?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full resize-none rounded-xl border border-pinkline bg-ink-50 px-4 py-3 text-snow placeholder:text-snow-dim/60 transition-all duration-200 focus:border-hotpink/50 focus:outline-none focus:shadow-glow"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

interface SectionProps {
  label: string;
  events: AcademyEvent[];
  onDelete: (id: string) => void;
  ownerId?: string;
  dimmed?: boolean;
}

function EventSection({ label, events, onDelete, ownerId, dimmed }: SectionProps) {
  if (events.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-snow-dim">
        {label}
      </h2>
      <div className="flex flex-col gap-3">
        {events.map((ev) => (
          <article
            key={ev.id}
            className={`group flex gap-4 rounded-2xl border border-pinkline bg-ink-100/60 p-4 transition-all duration-300 hover:border-hotpink/30 hover:shadow-glow ${
              dimmed ? 'opacity-60' : ''
            }`}
          >
            <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-pinkline bg-ink-50 py-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-gold">
                {formatMonth(ev.event_date)}
              </span>
              <span className="font-display text-xl text-snow">
                {formatDay(ev.event_date)}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <h3 className="font-display text-base text-snow">{ev.title}</h3>
              <p className="text-xs text-snow-dim">{formatFullDate(ev.event_date)}</p>
              {ev.description && (
                <p className="mt-1 text-sm leading-relaxed text-snow-muted">
                  {ev.description}
                </p>
              )}
            </div>
            {ev.user_id === ownerId && (
              <button
                onClick={() => onDelete(ev.id)}
                className="self-start rounded-lg p-1.5 text-snow-dim transition-colors hover:bg-error/10 hover:text-error-soft"
                aria-label="Delete event"
              >
                <Trash2 size={15} />
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function buildMonthGrid(month: Date): (Date | null)[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatMonth(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' });
}

function formatDay(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric' });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
