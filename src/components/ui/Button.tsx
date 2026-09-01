import { type ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'gold' | 'pink' | 'ghost' | 'subtle' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  gold: 'bg-gold text-ink font-semibold hover:bg-gold-soft transition-colors duration-200',
  pink: 'bg-hotpink text-snow font-semibold hover:bg-hotpink-deep transition-colors duration-200',
  ghost: 'bg-transparent text-snow-muted hover:text-snow hover:bg-white/5 transition-colors duration-200',
  subtle: 'bg-white/5 text-snow border border-pinkline hover:border-hotpink/50 hover:bg-white/8 transition-colors duration-200',
  danger: 'bg-error/15 text-error-soft border border-error/30 font-medium hover:bg-error/25 hover:border-error/50 transition-colors duration-200',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'pink', size = 'md', className = '', ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-hotpink/50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
