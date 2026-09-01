import { useEffect, useState } from 'react';
import { Loader2, Users, KeyRound, X, Check, Crown, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import {
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  PERMISSION_DESCRIPTIONS,
  hasPermission,
} from '@/lib/permissions';
import type { AdminMember, MemberPermissions, PermissionKey } from '@/lib/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export function Members({ mentorshipOnly = false }: { mentorshipOnly?: boolean }) {
  const { profile } = useAuth();
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permModalFor, setPermModalFor] = useState<AdminMember | null>(null);

  const canManage = hasPermission(profile, 'approve_members');

  const load = async () => {
    setLoading(true);
    if (mentorshipOnly) {
      const { data, error } = await supabase.rpc('get_mentorship_members');
      if (error) {
        setError(error.message);
      } else {
        setMembers((data ?? []) as AdminMember[]);
      }
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, avatar_url, status, is_admin, permissions, tier, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
      } else {
        setMembers((data ?? []) as AdminMember[]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-pinkline bg-ink-100 shadow-glow">
          <Users className="text-hotpink" size={20} />
        </span>
        <div>
          <h1 className="font-display text-3xl text-snow">Members</h1>
          <p className="mt-0.5 text-sm text-snow-dim">
            The atelier roster{canManage ? ' — manage member permissions below.' : '.'}
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
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-pinkline bg-ink-100/40 py-20 text-center">
          <Users className="text-hotpink/40" size={32} />
          <p className="font-display text-xl text-snow">No approved members yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {members.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              canManage={canManage}
              currentUserId={profile?.id}
              onGivePermissions={() => setPermModalFor(m)}
            />
          ))}
        </div>
      )}

      {permModalFor && (
        <PermissionsModal
          member={permModalFor}
          onClose={() => setPermModalFor(null)}
          onSaved={() => {
            setPermModalFor(null);
            load();
          }}
        />
      )}
    </div>
  );
}

interface MemberRowProps {
  member: AdminMember;
  canManage: boolean;
  currentUserId?: string;
  onGivePermissions: () => void;
}

function MemberRow({ member, canManage, currentUserId, onGivePermissions }: MemberRowProps) {
  const granted = PERMISSION_KEYS.filter(
    (k) => member.is_admin || member.permissions?.[k],
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-pinkline bg-ink-100/60 p-4 transition-colors hover:border-hotpink/20 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={member.display_name} src={member.avatar_url} size={40} />
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-snow">{member.display_name}</span>
            {member.is_admin && (
              <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
                Admin
              </span>
            )}
            {member.tier === 'mentorship' && (
              <span className="flex items-center gap-0.5 rounded-full bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-soft">
                <Crown size={9} /> Mentorship
              </span>
            )}
            {granted.length > 0 && !member.is_admin && (
              <span className="rounded-full bg-snow/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-snow-dim">
                {granted.length} permission{granted.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <span className="text-xs text-snow-dim">{member.email ?? '\u2014'}</span>
          {granted.length > 0 && !member.is_admin && (
            <span className="mt-0.5 text-[11px] text-snow-dim/70">
              {granted.map((k) => PERMISSION_LABELS[k]).join(' \u00b7 ')}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {canManage && !(member.is_admin && member.id === currentUserId) && (
          <Button variant="subtle" size="sm" onClick={onGivePermissions}>
            <KeyRound size={14} /> {member.is_admin ? 'Manage role' : 'Give permissions'}
          </Button>
        )}
      </div>
    </div>
  );
}

interface PermissionsModalProps {
  member: AdminMember;
  onClose: () => void;
  onSaved: () => void;
}

function PermissionsModal({ member, onClose, onSaved }: PermissionsModalProps) {
  const [perms, setPerms] = useState<MemberPermissions>(member.permissions ?? {});
  const [makeAdmin, setMakeAdmin] = useState(member.is_admin);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: PermissionKey) => {
    setPerms((cur) => ({ ...cur, [key]: !cur[key] }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const clean: MemberPermissions = {};
    for (const k of PERMISSION_KEYS) {
      if (perms[k]) clean[k] = true;
    }
    const { error } = await supabase.rpc('set_member_role', {
      p_member: member.id,
      p_is_admin: makeAdmin,
      p_permissions: clean,
    });
    setSaving(false);
    if (error) {
      setError(
        error.message.includes('Not authorized')
          ? 'You do not have permission to do this.'
          : error.message.includes('cannot remove your own')
          ? 'You cannot remove your own admin status.'
          : 'Could not save changes. Please try again.'
      );
      return;
    }
    onSaved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Permissions \u00b7 ${member.display_name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
            Save permissions
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-snow-dim">
          Toggle the permissions this member can use. They will only see the
          controls for permissions granted here.
        </p>

        {/* Admin toggle */}
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
            makeAdmin
              ? 'border-gold/50 bg-gold/10'
              : 'border-pinkline bg-ink-50 hover:border-gold/20'
          }`}
        >
          <button
            type="button"
            role="switch"
            aria-checked={makeAdmin}
            onClick={() => setMakeAdmin(!makeAdmin)}
            className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              makeAdmin ? 'bg-gold' : 'bg-white/10'
            }`}
          >
            <span
              className={`mx-0.5 h-4 w-4 rounded-full bg-ink transition-transform ${
                makeAdmin ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-sm font-medium text-snow">
              <Shield size={14} className={makeAdmin ? 'text-gold' : 'text-snow-dim'} />
              Full Admin
            </span>
            <span className="text-xs text-snow-dim">
              Grants full access to everything — admin panel, content management, member approval, and can assign permissions to others.
            </span>
          </div>
        </label>

        <div className="flex items-center gap-2">
          <span className="h-px flex-1 bg-pinkline" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-snow-dim/60">Or grant specific permissions</span>
          <span className="h-px flex-1 bg-pinkline" />
        </div>

        {PERMISSION_KEYS.map((key) => (
          <label
            key={key}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
              perms[key]
                ? 'border-hotpink/40 bg-hotpink/5'
                : 'border-pinkline bg-ink-50 hover:border-hotpink/20'
            }`}
          >
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(perms[key])}
              onClick={() => toggle(key)}
              className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                perms[key] ? 'bg-hotpink' : 'bg-white/10'
              }`}
            >
              <span
                className={`mx-0.5 h-4 w-4 rounded-full bg-ink transition-transform ${
                  perms[key] ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-snow">
                {PERMISSION_LABELS[key]}
              </span>
              <span className="text-xs text-snow-dim">
                {PERMISSION_DESCRIPTIONS[key]}
              </span>
            </div>
          </label>
        ))}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error-soft">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-error-soft/70 hover:text-error-soft">
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
