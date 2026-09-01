import { useEffect, useRef, useState } from 'react';
import { Loader2, Upload, Trash2, Check, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageCropModal } from '@/components/ui/ImageCropModal';
import { AdminPanel } from '@/components/AdminPanel';

export function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user?.id)
      .maybeSingle();
    if (error) {
      setError('Could not load your profile. Please try again.');
    } else if (data) {
      setDisplayName(data.display_name ?? '');
      setAvatarUrl(data.avatar_url ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveName = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) return;
    setSavingName(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', user?.id);
    setSavingName(false);
    if (error) {
      setError('Could not save your name. Please try again.');
    } else {
      setSuccess('Display name updated.');
      refreshProfile();
    }
  };

  const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG or JPEG).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Please choose an image under 10 MB.');
      return;
    }
    setError(null);
    setSuccess(null);
    setPendingFile(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onCropped = async (blob: Blob, fileName: string) => {
    if (!user) return;
    setPendingFile(null);
    setUploading(true);
    setError(null);
    setSuccess(null);

    const path = `${user.id}/avatar-${Date.now()}-${fileName}`;
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, blob, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' });

    if (upErr) {
      console.error('avatar upload failed', upErr);
      setUploading(false);
      setError(`Upload failed: ${upErr.message}`);
      return;
    }

    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    const cleanUrl = pub.publicUrl;

    const previousUrl = avatarUrl;
    const { error: updErr } = await supabase
      .from('profiles')
      .update({ avatar_url: cleanUrl })
      .eq('id', user.id);

    setUploading(false);

    if (updErr) {
      console.error('avatar profile update failed', updErr);
      await supabase.storage.from('avatars').remove([path]);
      setError(`Could not save photo: ${updErr.message}`);
      return;
    }

    if (previousUrl) {
      const previousPath = avatarPathFromUrl(previousUrl);
      if (previousPath) await supabase.storage.from('avatars').remove([previousPath]);
    }

    setAvatarUrl(cleanUrl);
    setSuccess('Profile photo updated.');
    refreshProfile();
  };

  const removePhoto = async () => {
    if (!user) return;
    setError(null);
    setSuccess(null);
    if (avatarUrl) {
      const path = avatarPathFromUrl(avatarUrl);
      if (path) await supabase.storage.from('avatars').remove([path]);
    }
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id);
    if (error) {
      setError('Could not remove your photo. Please try again.');
      return;
    }
    setAvatarUrl(null);
    setSuccess('Profile photo removed.');
    refreshProfile();
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-snow-dim">
        <Loader2 className="animate-spin" size={22} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      {pendingFile && (
        <ImageCropModal
          file={pendingFile}
          onCancel={() => setPendingFile(null)}
          onCropped={onCropped}
        />
      )}

      <div className="mb-6">
        <h1 className="font-display text-3xl text-snow">Settings</h1>
        <p className="mt-1 text-sm text-snow-dim">
          Update your profile name and photo.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error-soft">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm text-gold-soft">
          <span className="inline-flex items-center gap-1.5">
            <Check size={14} /> {success}
          </span>
        </div>
      )}

      <div className="rounded-2xl border border-pinkline bg-ink-100/60 p-6 shadow-glow">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <Avatar name={displayName || 'Member'} src={avatarUrl} size={80} />
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <p className="text-sm text-snow-dim">
              {avatarUrl ? 'Your current photo' : 'No photo yet — initials will show'}
            </p>
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={onFileChosen}
                className="hidden"
              />
              <Button
                size="sm"
                variant="subtle"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="animate-spin" size={15} /> : <Upload size={15} />}
                {avatarUrl ? 'Replace' : 'Upload'}
              </Button>
              {avatarUrl && (
                <Button size="sm" variant="ghost" onClick={removePhoto} disabled={uploading}>
                  <Trash2 size={15} /> Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-pinkline bg-ink-100/60 p-6 shadow-glow">
        <Input
          label="Display name"
          name="display_name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={saveName} disabled={savingName || !displayName.trim()}>
            {savingName ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
            Save name
          </Button>
        </div>
      </div>

      {profile?.is_admin && (
        <div className="mt-8 border-t border-pinkline/40 pt-8">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="text-gold" size={20} />
            <h2 className="font-display text-xl text-snow">Admin</h2>
          </div>
          <AdminPanel />
        </div>
      )}
    </div>
  );
}

function avatarPathFromUrl(url: string): string | null {
  try {
    const path = decodeURIComponent(new URL(url).pathname);
    const marker = '/storage/v1/object/public/avatars/';
    return path.startsWith(marker) ? path.slice(marker.length) : null;
  } catch {
    return null;
  }
}
