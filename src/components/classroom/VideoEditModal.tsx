import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { extractVimeoId, fetchVimeoThumbnail, toVimeoEmbedHtml, vimeoThumbnailUrl } from '@/lib/vimeo';
import type { VideoLibraryItem } from '@/lib/types';

interface VideoEditModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingVideo?: VideoLibraryItem | null;
}

const CATEGORIES = ['Beginner', 'intermediate', 'Advanced', 'Serger', 'general', 'Technique', 'Headwear', 'Pets', 'Software/Printing'];

export function VideoEditModal({ open, onClose, onSaved, editingVideo }: VideoEditModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [vimeoInput, setVimeoInput] = useState('');
  const [category, setCategory] = useState('general');
  const [sortOrder, setSortOrder] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [resourcePdfUrl, setResourcePdfUrl] = useState('');
  const [templatesZipUrl, setTemplatesZipUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [thumbLoading, setThumbLoading] = useState(false);
  const [autoTitle, setAutoTitle] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEditing = !!editingVideo;

  useEffect(() => {
    if (open) {
      if (editingVideo) {
        setTitle(editingVideo.title);
        setDescription(editingVideo.description ?? '');
        setVimeoInput(editingVideo.vimeo_url ?? '');
        setCategory(editingVideo.category);
        setSortOrder(editingVideo.sort_order);
        setIsVisible(editingVideo.is_visible);
        setResourcePdfUrl(editingVideo.resource_pdf_url ?? '');
        setTemplatesZipUrl(editingVideo.templates_zip_url ?? '');
        const existingVimeoId = editingVideo.vimeo_url ? extractVimeoId(editingVideo.vimeo_url) : null;
        setThumbPreview(existingVimeoId ? vimeoThumbnailUrl(existingVimeoId) : editingVideo.thumbnail_url);
        setAutoTitle('');
      } else {
        setTitle('');
        setDescription('');
        setVimeoInput('');
        setCategory('general');
        setSortOrder(0);
        setIsVisible(true);
        setResourcePdfUrl('');
        setTemplatesZipUrl('');
        setThumbPreview(null);
        setAutoTitle('');
      }
      setError(null);
      setBusy(false);
      setThumbLoading(false);
    }
  }, [open, editingVideo]);

  const onVimeoChange = (val: string) => {
    setVimeoInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setThumbPreview(null);
      setThumbLoading(false);
      setAutoTitle('');
      return;
    }
    setThumbLoading(true);
    debounceRef.current = setTimeout(async () => {
      const oembed = await fetchVimeoThumbnail(val);
      setThumbLoading(false);
      if (oembed) {
        if (oembed.thumbnail_url) setThumbPreview(oembed.thumbnail_url);
        if (oembed.title && !title.trim()) setAutoTitle(oembed.title);
      }
    }, 600);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || autoTitle.trim();
    if (!finalTitle) return;

    const embed = toVimeoEmbedHtml(vimeoInput);
    const vimeoId = extractVimeoId(vimeoInput);
    const thumb = vimeoId ? vimeoThumbnailUrl(vimeoId) : thumbPreview;

    setBusy(true);
    setError(null);

    const payload = {
      title: finalTitle,
      description: description.trim() || null,
      vimeo_url: embed,
      thumbnail_url: thumb,
      thumbnail_emoji: '🎬',
      category,
      is_visible: isVisible,
      sort_order: sortOrder,
      resource_pdf_url: resourcePdfUrl.trim() || null,
      templates_zip_url: templatesZipUrl.trim() || null,
    };

    if (isEditing && editingVideo) {
      const { error } = await supabase.from('video_library').update(payload).eq('id', editingVideo.id);
      setBusy(false);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase.from('video_library').insert(payload);
      setBusy(false);
      if (error) { setError(error.message); return; }
    }

    onSaved();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Video' : 'Add Video'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" form="video-edit-form" disabled={busy || (!title.trim() && !autoTitle.trim())}>
            {busy ? <Loader2 className="animate-spin" size={16} /> : isEditing ? 'Save Changes' : 'Add Video'}
          </Button>
        </>
      }
    >
      <form id="video-edit-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Thumbnail preview */}
        <div className="relative h-36 overflow-hidden rounded-xl border border-pinkline bg-ink-50">
          {thumbLoading ? (
            <div className="flex h-full w-full items-center justify-center gap-2 text-sm text-snow-dim">
              <Loader2 className="animate-spin" size={18} /> Fetching thumbnail…
            </div>
          ) : thumbPreview ? (
            <img src={thumbPreview} alt="Thumbnail preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-snow-dim/60">
              Paste a Vimeo URL to auto-load the thumbnail
            </div>
          )}
        </div>

        <Input
          label="Title"
          name="title"
          placeholder={autoTitle || 'e.g. Serger Things'}
          autoFocus
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-snow-dim">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Short description of the video..."
            className="w-full rounded-xl border border-pinkline bg-ink-50 px-4 py-3 text-snow placeholder:text-snow-dim/60 focus:border-hotpink/50 focus:outline-none focus:shadow-glow transition-all duration-200 resize-none"
          />
        </div>

        <Input
          label="Vimeo URL or Embed Code"
          name="vimeo_url"
          placeholder="Paste Vimeo link or full embed code"
          value={vimeoInput}
          onChange={(e) => onVimeoChange(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-snow-dim">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-pinkline bg-ink-50 px-4 py-3 text-snow focus:border-hotpink/50 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-ink-100">{c}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Sort Order"
            name="sort_order"
            type="number"
            min="0"
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-snow-dim">Visible</label>
            <button
              type="button"
              onClick={() => setIsVisible(!isVisible)}
              className={`flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                isVisible
                  ? 'border-success/30 bg-success/10 text-success-soft'
                  : 'border-pinkline bg-ink-50 text-snow-dim'
              }`}
            >
              {isVisible ? 'Visible to members' : 'Hidden'}
            </button>
          </div>
        </div>

        <Input
          label="Resource PDF URL (optional)"
          name="resource_pdf_url"
          placeholder="https://..."
          value={resourcePdfUrl}
          onChange={(e) => setResourcePdfUrl(e.target.value)}
        />
        <Input
          label="Templates ZIP URL (optional)"
          name="templates_zip_url"
          placeholder="https://..."
          value={templatesZipUrl}
          onChange={(e) => setTemplatesZipUrl(e.target.value)}
        />
        {error && (
          <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error-soft">{error}</p>
        )}
      </form>
    </Modal>
  );
}
