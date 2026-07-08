import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-white/60">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'rounded-glass-sm border border-glass-border bg-glass-white px-4 py-2.5 text-sm',
            'text-white placeholder-white/40 outline-none',
            'backdrop-blur-glass-sm',
            'transition-all duration-200',
            'focus:border-glass-border-strong focus:bg-glass-white-md',
            'disabled:opacity-50',
            error && 'border-brand-tomato/70 focus:border-brand-tomato',
            className,
          )}
          style={{ backdropFilter: 'blur(16px)' }}
          {...props}
        />
        {error && <p className="text-xs text-brand-tomato">{error}</p>}
      </div>
    )
  },
)
GlassInput.displayName = 'GlassInput'
