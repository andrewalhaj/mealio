import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'primary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ variant = 'default', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // base
          'inline-flex items-center justify-center gap-2 font-medium transition-all',
          'rounded-glass-sm border focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-white/50 disabled:pointer-events-none disabled:opacity-50',
          'active:scale-[0.97] duration-150 ease-spring',
          // size
          size === 'sm' && 'px-3 py-1.5 text-xs',
          size === 'md' && 'px-4 py-2 text-sm',
          size === 'lg' && 'px-6 py-3 text-base',
          // variant
          variant === 'default' && [
            'glass border-glass-border text-white/90',
            'hover:bg-glass-white-md hover:border-glass-border-strong',
          ],
          variant === 'primary' && [
            'bg-brand-saffron/80 border-brand-saffron text-white',
            'hover:bg-brand-saffron hover:shadow-glass',
          ],
          variant === 'ghost' && [
            'border-transparent bg-transparent text-white/70',
            'hover:bg-glass-white hover:text-white',
          ],
          variant === 'danger' && [
            'border-brand-tomato/50 bg-brand-tomato/20 text-white',
            'hover:bg-brand-tomato/30',
          ],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
GlassButton.displayName = 'GlassButton'
