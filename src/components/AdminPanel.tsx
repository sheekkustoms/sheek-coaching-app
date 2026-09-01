import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, UserCheck, UserX, Trash2, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AdminMember } from '@/lib/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';

export function AdminPanel() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, email, avatar_url, status, is_admin, permissions, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setMembers((data ?? []) as AdminMember[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: 'approved' | 'removed') => {
    const prev = members;
    setMembers((cur) => cur.map((m) => (m.id === id ? { ...m, status } : m)));
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
    if (error) {
      setMembers(prev);
      setError(error.message);
    } else {
      setError(null);
    }
  };

  const pending = members.filter((m) => m.status === 'pending');
  const approved = members.filter((m) => m.status === 'approved');

  const filteredApproved = approved.filter((m) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      m.display_name.toLowerCase().includes(q) ||
      (m.email ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-pinkline bg-ink-100 shadow-glow">
          <ShieldCheck className="text-gold" size={20} />
        </span>
        <div>
          <h1 className="font-display text-3xl text-snow">Admin Panel</h1>
          <p className="mt-0.5 text-sm text-snow-dim">
            Approve new members and manage existing ones.
          </p>
        </div>
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
        <div className="flex flex-col gap-8">
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="font-display text-xl text-snow">Pending Approval</h2>
              {pending.length > 0 && (
                <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold">
                  {pending.length}
                </span>
              )}
            </div>
            {pending.length === 0 ? (
              <div className="rounded-2xl border border-pinkline bg-ink-100/40 px-5 py-10 text-center">
                <p className="text-sm text-snow-dim">No members awaiting approval.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pending.map((m) => (
                  <PendingRow key={m.id} member={m} onApprove={() => setStatus(m.id, 'approved')} onReject={() => setStatus(m.id, 'removed')} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="font-display text-xl text-snow">All Members</h2>
              <span className="rounded-full bg-snow/10 px-2 py-0.5 text-xs font-semibold text-snow-dim">
                {approved.length}
              </span>
            </div>

            {approved.length === 0 ? (
              <div className="rounded-2xl border border-pinkline bg-ink-100/40 px-5 py-10 text-center">
                <p className="text-sm text-snow-dim">No approved members yet.</p>
              </div>
            ) : (
              <>
                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-snow-dim" size={15} />
                  <input
                    type="text"
                    placeholder="Search members by name or email..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-xl border border-pinkline bg-ink-50 py-2.5 pl-10 pr-4 text-sm text-snow placeholder:text-snow-dim/60 transition-all focus:border-hotpink/40 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  {filteredApproved.map((m) => (
                    <MemberRow key={m.id} member={m} onRemove={() => setStatus(m.id, 'removed')} />
                  ))}
                  {filteredApproved.length === 0 && (
                    <p className="py-4 text-center text-sm text-snow-dim">
                      No members match "{query}".
                    </p>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

interface PendingRowProps {
  member: AdminMember;
  onApprove: () => void;
  onReject: () => void;
}

function PendingRow({ member, onApprove, onReject }: PendingRowProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-pinkline bg-ink-100/60 p-4 shadow-glow sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={member.display_name} src={member.avatar_url} size={40} />
        <div className="flex flex-col">
          <span className="font-medium text-snow">{member.display_name}</span>
          <span className="text-xs text-snow-dim">{member.email ?? '—'}</span>
          <span className="mt-0.5 text-[11px] text-snow-dim/70">
            Signed up {formatDate(member.created_at)}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onApprove}>
          <UserCheck size={15} /> Approve
        </Button>
        <Button size="sm" variant="danger" onClick={onReject}>
          <UserX size={15} /> Reject
        </Button>
      </div>
    </div>
  );
}

interface MemberRowProps {
  member: AdminMember;
  onRemove: () => void;
}

function MemberRow({ member, onRemove }: MemberRowProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-pinkline bg-ink-100/60 p-4 transition-colors hover:border-hotpink/20 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={member.display_name} src={member.avatar_url} size={40} />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium text-snow">{member.display_name}</span>
            {member.is_admin && (
              <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
                Admin
              </span>
            )}
          </div>
          <span className="text-xs text-snow-dim">{member.email ?? '—'}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!member.is_admin && (
          <Button size="sm" variant="danger" onClick={onRemove}>
            <Trash2 size={14} /> Remove
          </Button>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
