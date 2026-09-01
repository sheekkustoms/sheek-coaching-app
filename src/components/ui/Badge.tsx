import { type ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  tone?: 'draft' | 'pink' | 'gold' | 'muted' | 'success';
  className?: string;
}

const tones = {
  draft: 'bg-hotpink/15 text-hotpink-soft border border-hotpink/30',
  pink: 'bg-hotpink text-snow border border-hotpink',
  gold: 'bg-gold/15 text-gold-soft border border-gold/30',
  muted: 'bg-white/5 text-snow-dim border border-pinkline',
  success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
};

export function Badge({ children, tone = 'muted', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
