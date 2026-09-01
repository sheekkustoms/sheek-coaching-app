import React, { useEffect, useState } from 'react';
import { Bell, Pin, Sparkles, Clock } from 'lucide-react';
import { supabase, logActivity } from '@/lib/supabase';
import type { Announcement, Profile } from '@/lib/types';

interface Props {
  profile: Profile | null;
}

export function AnnouncementsView({ profile }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setAnnouncements(data as Announcement[]);
      } else {
        // Fallback default announcements
        setAnnouncements([
          {
            id: 'a1',
            title: '🎉 Welcome to the Unified Coaching & Mentorship Suite!',
            content: 'We have officially merged our entire course classroom, 12-week mentorship roadmap, pricing tools, live mastermind booking, and certification rank ladder into one unified luxury platform.',
            is_pinned: true,
            created_at: new Date().toISOString(),
          },
          {
            id: 'a2',
            title: '📅 Next Monthly Live Mastermind Scheduled',
            content: 'Check the Coaching Calls tab to RSVP and add the upcoming Zoom session to your Google or Apple calendar.',
            is_pinned: false,
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
        ]);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-10 text-xs text-ivory-muted">Loading announcements...</div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`bg-forest-100/90 border rounded-2xl p-5 transition-all shadow-sm ${
                a.is_pinned ? 'border-gold shadow-gold-glow' : 'border-goldline/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {a.is_pinned && (
                    <span className="inline-flex items-center gap-1 bg-gold/20 text-gold text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-gold/40">
                      <Pin size={10} /> Pinned Update
                    </span>
                  )}
                  <span className="text-[11px] text-earth-tan flex items-center gap-1">
                    <Clock size={11} /> {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <h3 className="font-display text-lg font-bold text-ivory mb-2">{a.title}</h3>
              <p className="text-xs text-ivory-muted leading-relaxed whitespace-pre-wrap">{a.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AnnouncementsView;
