import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium uppercase tracking-wider text-snow-dim">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl bg-ink-50 border border-pinkline px-4 py-3 text-snow placeholder:text-snow-dim/60 focus:outline-none focus:border-hotpink/50 focus:shadow-glow transition-all duration-200 ${className}`}
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = 'Input';
