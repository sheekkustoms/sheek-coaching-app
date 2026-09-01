import { useState, useEffect, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Course } from '@/lib/types';

interface NewCourseModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  editingCourse?: Course | null;
}

export function NewCourseModal({ open, onClose, onCreated, editingCourse }: NewCourseModalProps) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editingCourse;

  useEffect(() => {
    if (open) {
      if (editingCourse) {
        setTitle(editingCourse.title);
        setPrice(editingCourse.price ? (editingCourse.price / 100).toString() : '');
      } else {
        setTitle('');
        setPrice('');
      }
      setError(null);
      setBusy(false);
    }
  }, [open, editingCourse]);

  const close = () => {
    onClose();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    const priceDollars = parseFloat(price);
    const priceCents = isNaN(priceDollars) || priceDollars <= 0 ? 0 : Math.round(priceDollars * 100);

    if (isEditing && editingCourse) {
      const { error } = await supabase
        .from('courses')
        .update({ title: title.trim(), price: priceCents })
        .eq('id', editingCourse.id);
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('courses').insert({
        title: title.trim(),
        price: priceCents,
      });
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
    }

    onCreated();
    close();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={isEditing ? 'Edit Course' : 'New Course'}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="new-course-form" disabled={busy || !title.trim()}>
            {busy ? <Loader2 className="animate-spin" size={16} /> : isEditing ? 'Save Changes' : 'Create Course'}
          </Button>
        </>
      }
    >
      <form id="new-course-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Course Title"
          name="title"
          placeholder="e.g. Couture Hand-Stitching"
          autoFocus
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="price" className="text-xs font-medium uppercase tracking-wider text-snow-dim">
            Price (USD) — optional
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-snow-dim">$</span>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl border border-pinkline bg-ink-50 px-4 py-3 pl-8 text-snow placeholder:text-snow-dim/60 focus:border-hotpink/50 focus:outline-none focus:shadow-glow transition-all duration-200"
            />
          </div>
          <p className="text-xs text-snow-dim/70">
            Leave blank or 0 to include this course free with membership. Enter a price to lock it behind a one-time payment.
          </p>
        </div>
        {error && (
          <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error-soft">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
