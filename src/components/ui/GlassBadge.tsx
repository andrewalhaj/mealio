import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'tomato' | 'saffron' | 'basil'

interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function GlassBadge({ variant = 'default', className, children, ...props }: GlassBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5',
        'text-[11px] font-medium uppercase tracking-wide',
        variant === 'default' && 'border-glass-border bg-glass-white text-white/80',
        variant === 'tomato' && 'border-brand-tomato/40 bg-brand-tomato/20 text-brand-tomato',
        variant === 'saffron' && 'border-brand-saffron/40 bg-brand-saffron/20 text-brand-saffron',
        variant === 'basil' && 'border-brand-basil/40 bg-brand-basil/20 text-brand-basil',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
