import { cn } from '@/lib/utils'
import { GlassCard } from './GlassCard'

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <GlassCard disableSpecular className={cn('h-72 overflow-hidden', className)}>
      <div className="h-full animate-pulse">
        <div className="h-[60%] bg-glass-white-md" />
        <div className="px-4 py-3 space-y-2">
          <div className="h-3 w-16 rounded-full bg-glass-white-md" />
          <div className="h-5 w-3/4 rounded bg-glass-white-md" />
          <div className="h-3 w-1/2 rounded bg-glass-white" />
        </div>
      </div>
    </GlassCard>
  )
}
