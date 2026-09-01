import React, { useEffect, useState } from 'react';
import { Award, CheckCircle, Lock, Upload, Sparkles, AlertCircle, ChevronRight, FileCheck, X } from 'lucide-react';
import { supabase, logActivity } from '@/lib/supabase';
import type { Certification, Profile } from '@/lib/types';

interface Props {
  profile: Profile | null;
}

const TIERS = [
  { level: 1, name: 'Needle Novice', minCourses: 0, desc: 'Enrolled in Oh Sew Sheek Academy & completed first lesson', badge: 'Novice' },
  { level: 2, name: 'Stitch Builder', minCourses: 5, desc: 'Completed 5 lessons & created first finished sample', badge: 'Builder' },
  { level: 3, name: 'Bonnet Boss', minCourses: 15, desc: 'Mastered sock bonnet & elastic construction with pricing formula', badge: 'Pro Maker' },
  { level: 4, name: 'Brand Builder', minCourses: 25, desc: 'Closed first paid client order and generated active client contract', badge: 'Authority' },
  { level: 5, name: 'SHEEK Certified', minCourses: 40, desc: 'Completed 12-Week Mentorship program with verified portfolio submission', badge: 'Master Artisan' },
];

export function CertificationsView({ profile }: Props) {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofNotes, setProofNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      logActivity(profile.id, 'page_view', 'Viewed: Certifications & Rank Ladder');
    }
  }, [profile?.id]);

  useEffect(() => {
    async function loadCerts() {
      const { data } = await supabase
        .from('certifications')
        .select('*')
        .order('created_at', { ascending: true });
      if (data && data.length > 0) {
        setCerts(data as Certification[]);
      } else {
        // Fallback default certificates
        setCerts([
          { id: 'c1', title: 'Sock Bonnet Master Artisan', description: 'Certified mastery in reversible sock bonnet construction, sizing, and satin lining.', is_earned: true, icon_type: 'award' },
          { id: 'c2', title: 'Garment Pricing & Contract Specialist', description: 'Certified in custom apparel pricing, profit margin calculations, and client contract execution.', is_earned: false, icon_type: 'award' },
          { id: 'c3', title: 'Sublimation & Apparel Crafting Pro', description: 'Complete mastery in full-wrap sublimation, heat press settings, and apparel placement.', is_earned: false, icon_type: 'award' },
          { id: 'c4', title: 'Oh Sew Sheek 12-Week Master Graduate', description: 'Honors certification for completing the 12-Week Mentorship & Launch Roadmap.', is_earned: false, icon_type: 'award' },
        ]);
      }
      setLoading(false);
    }
    loadCerts();
  }, []);

  async function handleUploadProof(e: React.FormEvent) {
    e.preventDefault();
    if (!proofFile && !proofNotes) return;
    setUploading(true);

    try {
      if (profile?.id) {
        await supabase.from('proof_uploads').insert({
          user_id: profile.id,
          cert_id: selectedCert?.id ?? null,
          notes: proofNotes,
          file_name: proofFile?.name ?? 'text-submission',
        });
        logActivity(profile.id, 'proof_upload', `Submitted project proof for: ${selectedCert?.title || 'Certification'}`);
      }
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setShowUploadModal(false);
        setProofFile(null);
        setProofNotes('');
      }, 2000);
    } catch {
      // Handled
    } finally {
      setUploading(false);
    }
  }

  // Calculate user level (demo default level 2)
  const currentTier = TIERS[1]; // Stitch Builder

  return (
    <div className="min-h-screen bg-ink text-ivory py-6 font-sans pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 pb-4 border-b border-goldline/30">
          <div className="text-[10px] font-bold tracking-widest uppercase text-gold mb-1">✦ Mastery & Credentials</div>
          <h1 className="font-display text-3xl font-bold text-ivory">Academy Certifications & Rank Ladder</h1>
          <p className="text-xs text-ivory-muted mt-1">Unlock verifiable badges and mastery ranks as you build your sewing empire.</p>
        </div>

        {/* Current Mastery Rank Card */}
        <div className="bg-gradient-to-br from-forest-100 via-forest-200 to-earth-100 border border-gold/40 shadow-gold-glow rounded-3xl p-6 sm:p-8 mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/20 border border-gold/40 text-gold shadow-gold-glow">
                <Award size={32} />
              </span>
              <div>
                <span className="inline-block bg-gold/20 text-gold text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-gold/30 mb-1">
                  Current Rank: Level {currentTier.level}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-ivory">{currentTier.name}</h2>
                <p className="text-xs text-earth-tan mt-0.5">{currentTier.desc}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedCert(certs[0]);
                setShowUploadModal(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-gold to-gold-deep text-earth-50 font-bold px-5 py-2.5 rounded-full text-xs shadow-gold-glow hover:brightness-110 transition-all shrink-0"
            >
              <Upload size={13} /> Submit Project Proof
            </button>
          </div>

          {/* 5-Level Progress Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-8 pt-6 border-t border-white/10">
            {TIERS.map((tier) => {
              const isCurrent = tier.level === currentTier.level;
              const isPast = tier.level < currentTier.level;
              return (
                <div
                  key={tier.level}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-forest-50 border-gold shadow-gold-glow'
                      : isPast
                      ? 'bg-forest-100/60 border-forest-light/40'
                      : 'bg-forest-100/30 border-white/5 opacity-50'
                  }`}
                >
                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isCurrent ? 'text-gold' : isPast ? 'text-forest-light' : 'text-ivory-muted'}`}>
                    Level {tier.level}
                  </div>
                  <div className="font-display text-xs font-bold text-ivory truncate">{tier.name}</div>
                  <div className="text-[10px] text-ivory-muted mt-1">{tier.badge}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Certificate Cards */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-ivory flex items-center gap-2">
            <Sparkles size={16} className="text-gold" />
            Earned & In-Progress Credentials
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {certs.map((c) => (
              <div
                key={c.id}
                className={`bg-forest-100/90 border rounded-3xl p-6 flex flex-col justify-between transition-all ${
                  c.is_earned ? 'border-gold shadow-gold-glow' : 'border-goldline/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      c.is_earned
                        ? 'bg-gold/20 text-gold border-gold/40'
                        : 'bg-forest-50 text-ivory-muted border-white/10'
                    }`}>
                      {c.is_earned ? '✓ Earned & Verified' : 'In Progress'}
                    </span>
                    <Award size={18} className={c.is_earned ? 'text-gold' : 'text-ivory-muted/40'} />
                  </div>
                  <h3 className="font-display text-lg font-bold text-ivory mb-2">{c.title}</h3>
                  <p className="text-xs text-ivory-muted leading-relaxed mb-4">{c.description}</p>
                </div>

                <div>
                  <button
                    onClick={() => {
                      setSelectedCert(c);
                      setShowUploadModal(true);
                    }}
                    className="w-full text-center py-2.5 rounded-full border border-goldline/50 text-xs font-bold text-gold hover:bg-gold hover:text-earth-50 transition-all"
                  >
                    {c.is_earned ? 'View Credential Proof' : 'Upload Completion Proof →'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Proof Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-forest-100 border border-goldline rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 sm:p-8 relative">
              <button
                onClick={() => setShowUploadModal(false)}
                className="absolute top-4 right-4 text-ivory-muted hover:text-ivory text-sm"
              >
                <X size={18} />
              </button>

              <div className="text-[10px] font-bold uppercase tracking-wider text-gold mb-1">✦ Verification Submission</div>
              <h3 className="font-display text-xl font-bold text-ivory mb-2">
                Submit Project Proof: {selectedCert?.title}
              </h3>
              <p className="text-xs text-ivory-muted mb-5">
                Upload clear photos of your finished piece or write project reflection notes for mentor review.
              </p>

              {uploadSuccess ? (
                <div className="bg-forest-200 border border-goldline rounded-2xl p-6 text-center text-xs text-earth-tan space-y-2">
                  <CheckCircle size={28} className="mx-auto text-gold" />
                  <p className="font-bold text-ivory text-sm">Proof Submitted Successfully!</p>
                  <p>Sheek will review your submission and update your certification badge.</p>
                </div>
              ) : (
                <form onSubmit={handleUploadProof} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-ivory-muted mb-1.5">
                      Upload Photos / Screenshots
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      className="w-full bg-forest-50 border border-goldline/50 rounded-xl p-2.5 text-xs text-ivory-dim file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gold file:text-earth-50 hover:file:brightness-110"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-ivory-muted mb-1.5">
                      Notes & Description
                    </label>
                    <textarea
                      value={proofNotes}
                      onChange={(e) => setProofNotes(e.target.value)}
                      placeholder="Share details about what you made, fabric used, pricing applied, or any breakthroughs..."
                      className="w-full bg-forest-50 border border-goldline/50 rounded-xl px-3 py-2 text-xs text-ivory outline-none focus:border-gold min-h-[90px]"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 bg-gradient-to-r from-gold to-gold-deep text-earth-50 font-bold py-2.5 rounded-full text-xs uppercase tracking-wider shadow-gold-glow hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {uploading ? 'Submitting...' : 'Submit for Mentor Review ✦'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-5 py-2.5 rounded-full border border-goldline/40 text-xs font-semibold text-ivory-dim hover:text-ivory"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CertificationsView;
