'use client'

import { CheckCircle, Circle, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard } from './GlassCard'

export type ImportStep = 'fetching' | 'reading' | 'structuring' | 'ready' | 'error'

const STEPS: { key: ImportStep; label: string }[] = [
  { key: 'fetching',    label: 'Fetching' },
  { key: 'reading',     label: 'Reading' },
  { key: 'structuring', label: 'Structuring' },
  { key: 'ready',       label: 'Ready to review' },
]

interface GlassToastProps {
  step: ImportStep
  message?: string
  visible: boolean
}

export function GlassToast({ step, message, visible }: GlassToastProps) {
  if (!visible) return null

  const stepIndex = STEPS.findIndex((s) => s.key === step)

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-toast-in">
      <GlassCard elevated className="min-w-72 px-5 py-4">
        <p className="mb-3 text-sm font-medium text-white">
          {step === 'error' ? 'Import failed' : 'Importing recipe…'}
        </p>
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const isDone    = stepIndex > i
            const isCurrent = stepIndex === i && step !== 'error'
            const isError   = step === 'error' && stepIndex === i
            return (
              <div key={s.key} className="flex flex-1 flex-col items-center gap-1">
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-full border transition-colors',
                  isDone    && 'border-brand-basil bg-brand-basil/20',
                  isCurrent && 'border-brand-saffron bg-brand-saffron/20',
                  isError   && 'border-brand-tomato bg-brand-tomato/20',
                  !isDone && !isCurrent && !isError && 'border-glass-border bg-glass-white',
                )}>
                  {isDone    && <CheckCircle className="h-4 w-4 text-brand-basil" />}
                  {isCurrent && <Loader2 className="h-4 w-4 animate-spin text-brand-saffron" />}
                  {isError   && <AlertCircle className="h-4 w-4 text-brand-tomato" />}
                  {!isDone && !isCurrent && !isError && <Circle className="h-4 w-4 text-white/30" />}
                </div>
                <span className={cn('text-[10px] text-center leading-tight',
                  isDone    && 'text-brand-basil',
                  isCurrent && 'text-brand-saffron',
                  isError   && 'text-brand-tomato',
                  !isDone && !isCurrent && !isError && 'text-white/40',
                )}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={cn('absolute hidden')} /> // spacer handled by flex-1
                )}
              </div>
            )
          })}
        </div>
        {message && <p className="mt-3 text-xs text-white/60">{message}</p>}
      </GlassCard>
    </div>
  )
}
