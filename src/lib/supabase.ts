import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Missing Supabase env vars. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.');
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const _recentLogs = new Map<string, number>();

export async function logActivity(
  userId: string,
  action: string,
  label: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!userId) return;
  const key = `${userId}:${action}:${label}`;
  const now = Date.now();
  if ((_recentLogs.get(key) ?? 0) > now - 3000) return;
  _recentLogs.set(key, now);
  try {
    await supabase.from('academy_activity_log').insert({
      user_id: userId,
      action,
      label,
      metadata: metadata ?? null,
    });
  } catch {
    // Non-blocking logging
  }
}

const _lastPresenceKey = new Map<string, string>();
export async function updatePresence(userId: string, view: string, detail = ''): Promise<void> {
  if (!userId) return;
  const key = `${view}:${detail}`;
  if (_lastPresenceKey.get(userId) === key) return;
  _lastPresenceKey.set(userId, key);
  try {
    await supabase.from('member_presence').upsert({
      user_id: userId,
      current_view: view,
      current_detail: detail,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    await supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', userId);
  } catch {
    // Non-blocking
  }
}

export async function updateStreak(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_days, longest_streak, last_active_at')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) return;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const lastStr = profile.last_active_at ? profile.last_active_at.slice(0, 10) : null;

    if (lastStr === todayStr) {
      await supabase.from('profiles').update({ last_active_at: now.toISOString() }).eq('id', userId);
      return;
    }

    let newStreak = 1;
    if (lastStr) {
      const diffMs = now.setHours(0, 0, 0, 0) - new Date(lastStr).setHours(0, 0, 0, 0);
      const diffDays = Math.round(diffMs / 86_400_000);
      if (diffDays === 1) {
        newStreak = ((profile as any).streak_days ?? 0) + 1;
      }
    }

    const newLongest = Math.max(newStreak, (profile as any).longest_streak ?? 0);

    await supabase.from('profiles').update({
      streak_days: newStreak,
      longest_streak: newLongest,
      last_active_at: new Date().toISOString(),
    }).eq('id', userId);
  } catch {
    // Non-blocking
  }
}


