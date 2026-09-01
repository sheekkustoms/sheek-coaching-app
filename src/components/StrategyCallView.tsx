import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Clock, CheckCircle2, ChevronRight, AlertCircle, Phone, Sparkles } from 'lucide-react';
import { supabase, logActivity } from '@/lib/supabase';
import type { AvailabilitySlot, Profile } from '@/lib/types';

interface Props {
  profile: Profile | null;
  onBack: () => void;
}

const CHECKLIST_ITEMS = [
  'I have watched at least one full class or mentorship lesson',
  'I know my primary sewing product / focus area',
  'I have 1–3 specific business or technique roadblocks prepared to discuss',
  'I have a quiet, distraction-free environment for our 20-minute strategy call',
];

export function StrategyCallView({ profile, onBack }: Props) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [checkedItems, setCheckedItems] = useState<boolean[]>([false, false, false, false]);
  const [phone, setPhone] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [goals, setGoals] = useState('');
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState('');

  const allChecked = checkedItems.every(Boolean);

  useEffect(() => {
    async function loadSlots() {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('strategy_call_availability')
        .select('*')
        .eq('is_booked', false)
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(10);

      if (data && data.length > 0) {
        setSlots(data as AvailabilitySlot[]);
      } else {
        // Fallback demo slots if database table is fresh
        const mock: AvailabilitySlot[] = [];
        const base = new Date();
        base.setDate(base.getDate() + 2);
        for (let i = 0; i < 4; i++) {
          const d = new Date(base);
          d.setDate(d.getDate() + i * 2);
          d.setHours(14, 0, 0, 0);
          const end = new Date(d);
          end.setMinutes(end.getMinutes() + 20);
          mock.push({
            id: `slot-mock-${i}`,
            start_time: d.toISOString(),
            end_time: end.toISOString(),
            is_booked: false,
          });
        }
        setSlots(mock);
      }
      setLoading(false);
    }
    loadSlots();
  }, []);

  function toggleCheck(index: number) {
    const next = [...checkedItems];
    next[index] = !next[index];
    setCheckedItems(next);
  }

  function fmtSlot(iso: string) {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }),
    };
  }

  async function handleBook() {
    if (!selectedSlot || !allChecked) return;
    setBooking(true);
    setError('');

    try {
      if (!selectedSlot.id.startsWith('slot-mock')) {
        await supabase.from('strategy_call_bookings').insert({
          user_id: profile?.id ?? null,
          slot_id: selectedSlot.id,
          phone,
          focus_area: focusArea,
          goals,
          status: 'confirmed',
        });
        await supabase
          .from('strategy_call_availability')
          .update({ is_booked: true })
          .eq('id', selectedSlot.id);
      }
      if (profile?.id) {
        logActivity(profile.id, 'strategy_call_booked', 'Booked 1:1 strategy session');
      }
      setBooked(true);
    } catch {
      setError('Could not complete booking. Please try another slot.');
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink text-ivory py-6 font-sans pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs text-earth-tan hover:text-gold mb-6 transition-colors font-semibold"
        >
          <ArrowLeft size={14} /> Back to Coaching Calls
        </button>

        {/* Title */}
        <div className="mb-8">
          <div className="text-[10px] font-bold tracking-widest uppercase text-gold mb-1">✦ Private Strategy & Mentorship</div>
          <h1 className="font-display text-3xl font-bold text-ivory">Book Your 1-on-1 Strategy Session</h1>
          <p className="text-xs text-ivory-muted mt-1">20 minutes of laser-focused direction directly with Sheek to unblock your sewing business.</p>
        </div>

        {booked ? (
          <div className="bg-gradient-to-br from-forest-100 via-forest-200 to-earth-100 border border-gold/50 shadow-gold-glow rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/20 border border-gold/40 text-gold mx-auto shadow-gold-glow">
              <CheckCircle2 size={32} />
            </span>
            <h2 className="font-display text-2xl font-bold text-ivory">Strategy Session Confirmed!</h2>
            <p className="text-xs text-earth-tan leading-relaxed">
              We have locked in your 20-minute session for{' '}
              <strong className="text-gold">
                {selectedSlot && `${fmtSlot(selectedSlot.start_time).date} at ${fmtSlot(selectedSlot.start_time).time}`}
              </strong>.
            </p>
            <p className="text-xs text-ivory-muted">A calendar invitation and Zoom details will be delivered to your email.</p>
            <button
              onClick={onBack}
              className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-gold to-gold-deep text-earth-50 font-bold px-6 py-2.5 rounded-full text-xs shadow-gold-glow"
            >
              Return to Coaching Hub
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Step 1: Readiness Checklist */}
            <div className="md:col-span-6 space-y-6">
              <div className="bg-forest-100/90 border border-goldline/40 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold mb-3">
                  <span className="flex h-5 w-5 rounded-full bg-gold/20 text-gold text-[10px] items-center justify-center border border-gold/40">1</span>
                  Session Readiness Checklist
                </div>
                <p className="text-xs text-ivory-muted mb-4">
                  Please confirm all 4 requirements so we can maximize every second of our 20 minutes together:
                </p>
                <div className="space-y-3">
                  {CHECKLIST_ITEMS.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleCheck(idx)}
                      className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer select-none transition-all ${
                        checkedItems[idx]
                          ? 'bg-forest-200/90 border-gold shadow-sm'
                          : 'bg-forest-50/70 border-white/5 hover:border-goldline'
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          checkedItems[idx] ? 'bg-gold border-gold' : 'border-goldline'
                        }`}
                      >
                        {checkedItems[idx] && <CheckCircle2 size={12} className="text-forest-50" />}
                      </div>
                      <span className="text-xs text-ivory/90 leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Intake Details */}
              <div className="bg-forest-100/90 border border-goldline/40 rounded-3xl p-6 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold mb-1">
                  <span className="flex h-5 w-5 rounded-full bg-gold/20 text-gold text-[10px] items-center justify-center border border-gold/40">2</span>
                  Intake Information
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-ivory-muted mb-1">Phone Number (For SMS reminders)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full bg-forest-50 border border-goldline/50 rounded-xl px-3 py-2 text-xs text-ivory outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-ivory-muted mb-1">What product or skill is your current focus?</label>
                  <input
                    type="text"
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                    placeholder="e.g. Sock Bonnets, Sublimation Apparel, Sizing..."
                    className="w-full bg-forest-50 border border-goldline/50 rounded-xl px-3 py-2 text-xs text-ivory outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-ivory-muted mb-1">Biggest goal for this 20-min session</label>
                  <textarea
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder="e.g. Fix my pricing formula, review client contract terms..."
                    className="w-full bg-forest-50 border border-goldline/50 rounded-xl px-3 py-2 text-xs text-ivory outline-none focus:border-gold min-h-[60px]"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Slot Picker & Confirm */}
            <div className="md:col-span-6 space-y-6">
              <div className="bg-forest-100/90 border border-goldline/40 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold mb-3">
                  <span className="flex h-5 w-5 rounded-full bg-gold/20 text-gold text-[10px] items-center justify-center border border-gold/40">3</span>
                  Select an Open Time Slot
                </div>

                {loading ? (
                  <div className="text-center py-8 text-xs text-ivory-muted">Loading open slots...</div>
                ) : slots.length === 0 ? (
                  <div className="p-6 bg-forest-50 rounded-2xl text-center text-xs text-ivory-muted border border-goldline/30">
                    No strategy call openings available this week. Please check back next Monday!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {slots.map((slot) => {
                      const { date, time } = fmtSlot(slot.start_time);
                      const isSelected = selectedSlot?.id === slot.id;
                      return (
                        <div
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-forest-200 to-earth-100 border-gold shadow-gold-glow'
                              : 'bg-forest-50/70 border-white/5 hover:border-goldline'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Calendar size={14} className={isSelected ? 'text-gold' : 'text-ivory-muted'} />
                            <div>
                              <div className="text-xs font-bold text-ivory">{date}</div>
                              <div className="text-[11px] text-earth-tan">{time} (20 min)</div>
                            </div>
                          </div>
                          <ChevronRight size={14} className={isSelected ? 'text-gold' : 'text-ivory-muted'} />
                        </div>
                      );
                    })}
                  </div>
                )}

                {error && <div className="text-xs text-error-soft bg-error/10 p-2 rounded mt-3">{error}</div>}

                <div className="mt-6 pt-4 border-t border-white/5">
                  <button
                    onClick={handleBook}
                    disabled={!allChecked || !selectedSlot || booking}
                    className="w-full bg-gradient-to-r from-gold to-gold-deep text-earth-50 font-bold py-3 rounded-full text-xs uppercase tracking-wider shadow-gold-glow hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {booking ? 'Locking in Session...' : !allChecked ? 'Complete Checklist to Unlock' : 'Confirm Strategy Session ✦'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StrategyCallView;
