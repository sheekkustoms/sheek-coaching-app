import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    /* Outer container: covers the entire viewport including under the navbar */
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-24">
      {/* Backdrop — absolute so it stays inside this stacking context */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal card — z-10 so it always sits above the backdrop */}
      <div
        className="relative z-10 flex w-full max-w-md flex-col rounded-2xl border border-pinkline bg-ink-100 shadow-glow-strong animate-scale-in"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-pinkline px-6 py-4">
          <h2 className="font-display text-xl text-snow">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-snow-dim transition-colors hover:bg-white/5 hover:text-snow"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex shrink-0 justify-end gap-3 border-t border-pinkline px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
