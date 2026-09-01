import React, { useEffect, useState } from 'react';
import { Scroll, Bell, Sparkles, Shield, Crown, BookOpen } from 'lucide-react';
import { logActivity } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { AnnouncementsView } from './AnnouncementsView';

interface Props {
  profile: Profile | null;
}

const COMMANDMENTS = [
  { num: 1, title: 'Never Work For Free', desc: 'Your hands, your machine time, and your drafting expertise have tangible market value. Never discount your worth.' },
  { num: 2, title: 'Collect 50% Upfront Always', desc: 'Fabric is not cut and machines do not turn on without a non-refundable deposit locked in.' },
  { num: 3, title: 'Execution Beats Perfection', desc: 'A finished, clean piece delivered on time beats a flawless prototype that sits on your cutting table for weeks.' },
  { num: 4, title: 'Know Your Cost Down to the Cent', desc: 'Price with mathematics, not emotion. Factor in your elastic, thread, packaging, shipping, and labor wage.' },
  { num: 5, title: 'Own Your Signature Aesthetic', desc: 'Do not blend in with generic garments. Develop recognizable craftsmanship that commands high-ticket rates.' },
  { num: 6, title: 'Treat Every Client Like Royalty', desc: 'Luxury packaging, clear communication, and punctual delivery turn one-time buyers into lifelong collectors.' },
  { num: 7, title: 'Reinvest in Your Mastery', desc: 'Continuous skill building in technique, marketing, and business strategy separates hobbyists from empire builders.' },
];

const PILLARS = [
  { letter: 'S', word: 'Sovereign', desc: 'Total financial and creative ownership of your business and time.' },
  { letter: 'H', word: 'Handcrafted', desc: 'Uncompromising standard of garment construction and structural integrity.' },
  { letter: 'E', word: 'Empowered', desc: 'Confidence to pitch, quote, and close clients at premium rates without hesitation.' },
  { letter: 'E', word: 'Elevated', desc: 'Luxury brand presentation from custom labels to client contract agreements.' },
  { letter: 'K', word: 'Kingdom', desc: 'Building a lasting legacy and community that uplifts the next generation of makers.' },
];

export function DoctrineView({ profile }: Props) {
  const [tab, setTab] = useState<'doctrine' | 'announcements'>('doctrine');

  useEffect(() => {
    if (profile?.id) {
      logActivity(profile.id, 'page_view', 'Viewed: The Doctrine');
    }
  }, [profile?.id]);

  return (
    <div className="min-h-screen bg-ink text-ivory py-6 font-sans pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Top Subnav */}
        <div className="flex items-center justify-between border-b border-goldline/30 pb-4 mb-8">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-gold mb-1">✦ Mindset & Code of Excellence</div>
            <h1 className="font-display text-3xl font-bold text-ivory">The SHEEK Doctrine & Codex</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTab('doctrine')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                tab === 'doctrine'
                  ? 'bg-gold/20 text-gold border border-gold/40 shadow-gold-glow'
                  : 'text-ivory-muted hover:text-ivory bg-forest-100/50'
              }`}
            >
              <Scroll size={13} /> The 7 Commandments
            </button>
            <button
              onClick={() => setTab('announcements')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                tab === 'announcements'
                  ? 'bg-gold/20 text-gold border border-gold/40 shadow-gold-glow'
                  : 'text-ivory-muted hover:text-ivory bg-forest-100/50'
              }`}
            >
              <Bell size={13} /> Academy Notices
            </button>
          </div>
        </div>

        {tab === 'announcements' ? (
          <AnnouncementsView profile={profile} />
        ) : (
          <div className="space-y-12">
            {/* The 5 Pillars */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gold mb-2 flex items-center gap-1.5">
                <Crown size={12} /> The 5 S.H.E.E.K. Pillars
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {PILLARS.map((p) => (
                  <div
                    key={p.letter + p.word}
                    className="bg-gradient-to-br from-forest-100 to-earth-100 border border-goldline/40 rounded-2xl p-4 text-center shadow-sm"
                  >
                    <div className="font-display text-3xl font-bold text-gold mb-0.5">{p.letter}</div>
                    <div className="text-xs font-bold text-ivory uppercase tracking-wider mb-2">{p.word}</div>
                    <p className="text-[11px] text-ivory-muted leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* The 7 Commandments */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gold mb-4 flex items-center gap-1.5">
                <Shield size={12} /> The 7 Commandments of Oh Sew Sheek
              </div>
              <div className="space-y-3">
                {COMMANDMENTS.map((c) => (
                  <div
                    key={c.num}
                    className="bg-forest-100/90 border border-goldline/40 hover:border-gold rounded-2xl p-5 flex items-start gap-4 transition-all shadow-sm group"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold text-sm font-bold border border-gold/30 group-hover:scale-105 transition-transform">
                      {c.num}
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-ivory group-hover:text-gold transition-colors">
                        {c.title}
                      </h3>
                      <p className="text-xs text-ivory-muted leading-relaxed mt-1">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctrineView;
