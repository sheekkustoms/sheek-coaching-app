import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Play, Clock, Video, CheckCircle2, HelpCircle, MessageSquare, ChevronRight } from 'lucide-react';
import { supabase, logActivity } from '@/lib/supabase';
import type { CoachingCall, Profile } from '@/lib/types';

interface Props {
  profile: Profile | null;
  onBack?: () => void;
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getCountdown(iso: string): Countdown {
  const diff = Math.max(0, new Date(iso).getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function fmtCallDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
  );
}

export function CoachingCallsView({ profile }: Props) {
  const [calls, setCalls] = useState<CoachingCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<Countdown>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const questionRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (profile?.id) {
      logActivity(profile.id, 'page_view', 'Viewed: Coaching Calls');
    }
  }, [profile?.id]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('coaching_calls')
        .select('*')
        .eq('is_visible', true)
        .order('date', { ascending: false });
      if (data) setCalls(data as CoachingCall[]);
      setLoading(false);
    }
    load();
  }, []);

  const nextCall = calls.find((c) => c.status === 'upcoming');
  const replays = calls.filter((c) => c.status === 'replay');

  useEffect(() => {
    if (!nextCall) return;
    const tick = () => setCountdown(getCountdown(nextCall.date));
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [nextCall?.id]);

  function googleCalendarUrl(call: CoachingCall) {
    const start = new Date(call.date);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const title = encodeURIComponent(call.title + ' — OSS Academy Coaching Call');
    const dates = `${fmt(start)}/${fmt(end)}`;
    const details = encodeURIComponent(
      call.zoom_link
        ? `Oh Sew Sheek Academy monthly coaching call.\nJoin Zoom: ${call.zoom_link}`
        : 'Oh Sew Sheek Academy monthly coaching call.'
    );
    const location = encodeURIComponent(call.zoom_link || 'Zoom');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&sf=true&output=xml`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const { error } = await supabase.from('call_questions').insert({
        user_id: profile?.id ?? null,
        name: profile?.display_name || 'Academy Member',
        question: question.trim(),
      });
      if (error) throw error;
      setSubmitted(true);
      setQuestion('');
      if (profile?.id) {
        logActivity(profile.id, 'question_submit', 'Submitted a coaching call question');
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const scrollToQuestion = () => {
    questionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-ink text-ivory font-sans pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-ivory-muted mb-6">
          <span>Academy Home</span>
          <span>/</span>
          <span className="text-gold font-semibold">Coaching Calls</span>
        </div>

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-forest-100 via-earth-100 to-forest-50 border border-goldline/40 rounded-3xl p-6 sm:p-10 shadow-gold-glow mb-10 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-earth-200 text-gold border border-goldline/40">
                <span className="h-2 w-2 rounded-full bg-gold" />
                MONTHLY ZOOM CALLS
              </span>

              <h1 className="font-display text-3xl sm:text-5xl font-bold text-ivory leading-tight">
                Get in the Room.<br />
                <em className="italic text-gold font-normal">Get Your Questions Answered.</em>
              </h1>

              <p className="text-xs sm:text-sm text-earth-tan leading-relaxed max-w-xl">
                One call a month. Live. Direct. <strong>Sheek answers your real questions</strong> — no scripts, no fluff, no gatekeeping. This is where breakthroughs happen.
              </p>

              <div className="pt-2">
                <button
                  onClick={scrollToQuestion}
                  className="inline-flex items-center gap-2 bg-forest-50/90 border border-goldline text-gold hover:bg-gold hover:text-earth-50 px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm"
                >
                  Submit a Question →
                </button>
              </div>
            </div>

            {/* Upcoming Call or No Call Box */}
            <div className="lg:col-span-4">
              {nextCall ? (
                <div className="bg-forest-50/90 border border-gold rounded-2xl p-6 text-center shadow-gold-glow space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gold">Next Scheduled Call</div>
                  <div className="font-display text-lg font-bold text-ivory">{nextCall.title}</div>
                  <div className="text-xs text-earth-tan">{fmtCallDate(nextCall.date)}</div>

                  <div className="grid grid-cols-4 gap-1.5 py-2">
                    {[
                      { label: 'D', val: countdown.days },
                      { label: 'H', val: countdown.hours },
                      { label: 'M', val: countdown.minutes },
                      { label: 'S', val: countdown.seconds },
                    ].map((u, i) => (
                      <div key={i} className="bg-forest-100 p-2 rounded-xl border border-white/5">
                        <div className="text-base font-bold text-gold">{String(u.val).padStart(2, '0')}</div>
                        <div className="text-[8px] text-ivory-muted uppercase">{u.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    {nextCall.zoom_link && (
                      <a
                        href={nextCall.zoom_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-gradient-to-r from-gold to-gold-deep text-earth-50 font-bold py-2 rounded-full text-xs shadow-gold-glow flex items-center justify-center gap-1.5"
                      >
                        <Video size={13} /> Join Live Zoom
                      </a>
                    )}
                    <a
                      href={googleCalendarUrl(nextCall)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-forest-100 border border-goldline/40 text-ivory-dim text-xs font-semibold py-1.5 rounded-full hover:text-ivory text-center"
                    >
                      Add to Calendar
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-earth-100/90 border border-goldline/30 rounded-2xl p-6 text-center space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gold/80">NO UPCOMING CALL</div>
                  <p className="text-xs text-ivory-muted">Check back soon for the next call date.</p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Submit Question Section */}
        <div ref={questionRef} className="bg-forest-100/90 border border-goldline/40 rounded-3xl p-6 sm:p-8 shadow-sm mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold/20 text-gold border border-goldline/40">
              <MessageSquare size={18} />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-ivory">Submit Your Question</h2>
              <p className="text-xs text-ivory-muted">Questions close 48 hours before the call — submit yours now so Sheek can prep.</p>
            </div>
          </div>

          <div className="bg-forest-50 p-3 rounded-2xl border border-white/5 mb-4 text-xs font-bold text-earth-tan uppercase tracking-wider">
            COACH: Coach Sheek
          </div>

          {submitted ? (
            <div className="bg-forest-200 border border-goldline rounded-2xl p-6 text-center text-xs text-earth-tan space-y-2">
              <CheckCircle2 size={28} className="mx-auto text-gold" />
              <p className="font-bold text-ivory text-sm">Question Submitted to Sheek!</p>
              <p>Your question will be reviewed and answered on the upcoming live call.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs text-gold underline pt-2 font-semibold"
              >
                Submit another question
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                  placeholder="What do you want Sheek to answer? Be specific — the more detail you give, the better the answer..."
                  className="w-full bg-forest-50 border border-goldline/50 rounded-2xl p-4 text-xs text-ivory outline-none focus:border-gold min-h-[110px] placeholder:text-ivory-muted/40"
                />
              </div>

              {submitError && (
                <div className="text-xs text-error-soft bg-error/10 p-2 rounded">{submitError}</div>
              )}

              <div className="flex justify-between items-center pt-2">
                <p className="text-[11px] text-ivory-muted">
                  Your question may be answered live. All questions are reviewed by Sheek.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-gold to-gold-deep text-earth-50 font-bold px-6 py-2.5 rounded-full text-xs uppercase tracking-wider shadow-gold-glow hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Submit Question ✦'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Call Replays Library */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ivory flex items-center gap-2">
              <Play size={16} className="text-gold" />
              Past Coaching Call Replays
            </h2>
            <span className="text-xs text-ivory-muted">{replays.length} Replays Available</span>
          </div>

          {loading ? (
            <div className="text-center py-10 text-xs text-ivory-muted">Loading replays...</div>
          ) : replays.length === 0 ? (
            <div className="bg-forest-100/90 border border-goldline/40 rounded-2xl p-8 text-center text-ivory-muted text-xs">
              No past call replays recorded yet. All live call recordings will be archived here.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {replays.map((call) => (
                <div
                  key={call.id}
                  className="bg-forest-100/90 border border-goldline/40 hover:border-gold rounded-3xl p-5 flex flex-col justify-between transition-all group shadow-sm"
                >
                  <div>
                    <div className="text-[10px] font-bold text-gold uppercase tracking-wider mb-1">
                      {new Date(call.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <h3 className="font-display text-base font-bold text-ivory group-hover:text-gold transition-colors mb-2">
                      {call.title}
                    </h3>
                    <div className="text-xs text-ivory-muted">
                      Full Recording · {call.duration_minutes || 60} mins
                    </div>
                  </div>

                  {call.replay_url && (
                    <button
                      onClick={() => setPlayingVideoUrl(call.replay_url)}
                      className="mt-4 inline-flex items-center justify-center gap-2 bg-gold/15 border border-gold/40 text-gold py-2 rounded-full text-xs font-bold hover:bg-gold hover:text-earth-50 transition-all"
                    >
                      <Play size={12} fill="currentColor" /> Watch Call Replay
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Video Player Modal */}
        {playingVideoUrl && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-forest-100 border border-goldline rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center px-4 py-3 border-b border-goldline/30 bg-forest-200">
                <span className="text-xs font-bold text-gold uppercase tracking-wider">Session Replay</span>
                <button
                  onClick={() => setPlayingVideoUrl(null)}
                  className="text-ivory-muted hover:text-ivory text-xs px-2 py-1"
                >
                  Close ✕
                </button>
              </div>
              <div className="aspect-video w-full bg-black">
                <iframe
                  src={playingVideoUrl}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default CoachingCallsView;
