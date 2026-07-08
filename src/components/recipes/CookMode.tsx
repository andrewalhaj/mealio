'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, X, Clock, Check } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Ingredient {
  id: string
  amount: string | null
  unit: string | null
  item: string
}

interface Step {
  id: string
  order: number
  text: string
  timerMins: number | null
}

interface CookModeProps {
  recipe: {
    id: string
    title: string
    dominantColor: string | null
    servings: number | null
    ingredients: Ingredient[]
    steps: Step[]
  }
}

export function CookMode({ recipe }: CookModeProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set())
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  // Per-step timers: stepIndex -> seconds remaining (null = not running)
  const [timers, setTimers] = useState<Record<number, number>>({})
  const [runningTimers, setRunningTimers] = useState<Set<number>>(new Set())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const totalSteps = recipe.steps.length
  const step = recipe.steps[currentStep]

  // ── Screen wake lock ────────────────────────────────────
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null
    const acquire = async () => {
      try {
        if ('wakeLock' in navigator && navigator.wakeLock) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch { /* not supported or denied — silent */ }
    }
    acquire()
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {})
      }
    }
  }, [])

  // ── Timer tick ──────────────────────────────────────────
  useEffect(() => {
    if (runningTimers.size === 0) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      return
    }
    intervalRef.current = setInterval(() => {
      setTimers(prev => {
        const next = { ...prev }
        let changed = false
        runningTimers.forEach(idx => {
          if ((next[idx] ?? 0) > 0) {
            next[idx] = (next[idx] ?? 0) - 1
            changed = true
          }
        })
        return changed ? next : prev
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [runningTimers])

  const startTimer = useCallback((idx: number, mins: number) => {
    setTimers(prev => ({ ...prev, [idx]: (prev[idx] ?? mins * 60) }))
    setRunningTimers(prev => new Set([...prev, idx]))
  }, [])

  const pauseTimer = useCallback((idx: number) => {
    setRunningTimers(prev => { const s = new Set(prev); s.delete(idx); return s })
  }, [])

  const resetTimer = useCallback((idx: number, mins: number) => {
    setTimers(prev => ({ ...prev, [idx]: mins * 60 }))
    setRunningTimers(prev => { const s = new Set(prev); s.delete(idx); return s })
  }, [])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      setCurrentStep(s => s + 1)
    }
  }
  const goPrev = () => { if (currentStep > 0) setCurrentStep(s => s - 1) }

  const isTimerRunning = runningTimers.has(currentStep)
  const timerSecs = timers[currentStep] ?? (step?.timerMins ? step.timerMins * 60 : null)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{
        background: recipe.dominantColor
          ? `radial-gradient(ellipse 100% 60% at 50% 0%, ${recipe.dominantColor}44 0%, #1c1f14 55%)`
          : '#1c1f14'
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <Link href={`/recipes/${recipe.id}`}>
          <GlassButton variant="ghost" size="sm">
            <X className="h-4 w-4" /> Exit
          </GlassButton>
        </Link>
        <h1 className="font-display text-lg font-bold text-white text-center flex-1 px-4 truncate">
          {recipe.title}
        </h1>
        <div className="text-sm font-mono text-white/50">
          {currentStep + 1} / {totalSteps}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-6 mb-4 h-1 rounded-full bg-glass-white overflow-hidden shrink-0">
        <div
          className="h-full rounded-full bg-brand-saffron transition-all duration-500 ease-glass"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 gap-6 px-6 pb-6 overflow-hidden">
        {/* Step panel — left / center */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Step number badge */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full glass border border-glass-border flex items-center justify-center font-mono text-brand-saffron font-bold text-lg shrink-0">
              {currentStep + 1}
            </div>
            {completedSteps.has(currentStep) && (
              <div className="flex items-center gap-1 text-brand-basil text-sm">
                <Check className="h-4 w-4" /> Done
              </div>
            )}
          </div>

          {/* Step text */}
          <GlassCard elevated className="flex-1 flex items-center p-8">
            <p className="font-sans text-2xl md:text-3xl text-white leading-relaxed font-light">
              {step?.text}
            </p>
          </GlassCard>

          {/* Timer */}
          {step?.timerMins && (
            <GlassCard className="p-4 flex items-center gap-4">
              <Clock className="h-5 w-5 text-brand-saffron shrink-0" />
              <span className="font-mono text-4xl font-bold text-white tabular-nums">
                {formatTime(timerSecs ?? step.timerMins * 60)}
              </span>
              <div className="ml-auto flex gap-2">
                {!isTimerRunning ? (
                  <GlassButton variant="primary" size="sm"
                    onClick={() => startTimer(currentStep, step.timerMins!)}>
                    Start
                  </GlassButton>
                ) : (
                  <GlassButton variant="default" size="sm"
                    onClick={() => pauseTimer(currentStep)}>
                    Pause
                  </GlassButton>
                )}
                <GlassButton variant="ghost" size="sm"
                  onClick={() => resetTimer(currentStep, step.timerMins!)}>
                  Reset
                </GlassButton>
              </div>
            </GlassCard>
          )}

          {/* Step nav */}
          <div className="flex gap-3">
            <GlassButton variant="default" size="lg" className="flex-1"
              onClick={goPrev} disabled={currentStep === 0}>
              <ChevronLeft className="h-5 w-5" /> Previous
            </GlassButton>
            {currentStep < totalSteps - 1 ? (
              <GlassButton variant="primary" size="lg" className="flex-1" onClick={goNext}>
                Next <ChevronRight className="h-5 w-5" />
              </GlassButton>
            ) : (
              <Link href={`/recipes/${recipe.id}`} className="flex-1">
                <GlassButton variant="primary" size="lg" className="w-full"
                  onClick={() => setCompletedSteps(prev => new Set([...prev, currentStep]))}>
                  <Check className="h-5 w-5" /> Done!
                </GlassButton>
              </Link>
            )}
          </div>
        </div>

        {/* Ingredients side panel */}
        <GlassCard className="hidden md:flex w-72 flex-col p-5 overflow-y-auto shrink-0">
          <h2 className="font-display text-lg font-bold text-white mb-4 shrink-0">
            Ingredients
          </h2>
          <ul className="space-y-2 flex-1 overflow-y-auto">
            {recipe.ingredients.map((ing) => (
              <li key={ing.id}
                className="flex items-start gap-2 cursor-pointer"
                onClick={() => setCheckedIngredients(prev => {
                  const s = new Set(prev)
                  s.has(ing.id) ? s.delete(ing.id) : s.add(ing.id)
                  return s
                })}
              >
                <span className={cn(
                  'mt-0.5 h-4 w-4 rounded border shrink-0 flex items-center justify-center transition-colors',
                  checkedIngredients.has(ing.id)
                    ? 'border-brand-basil bg-brand-basil'
                    : 'border-glass-border bg-glass-white'
                )}>
                  {checkedIngredients.has(ing.id) && (
                    <Check className="h-2.5 w-2.5 text-white" />
                  )}
                </span>
                <span className={cn(
                  'text-sm transition-opacity',
                  checkedIngredients.has(ing.id) && 'opacity-40 line-through'
                )}>
                  {ing.amount && <span className="font-mono text-brand-saffron">{ing.amount} </span>}
                  {ing.unit && <span className="font-mono text-brand-saffron">{ing.unit} </span>}
                  <span className="text-white">{ing.item}</span>
                </span>
              </li>
            ))}
          </ul>

          {/* Step progress dots */}
          <div className="mt-4 pt-4 border-t border-glass-border shrink-0">
            <p className="text-xs text-white/50 mb-2 uppercase tracking-wide">Steps</p>
            <div className="flex flex-wrap gap-1.5">
              {recipe.steps.map((_, i) => (
                <button key={i} onClick={() => setCurrentStep(i)}
                  className={cn(
                    'h-6 w-6 rounded-full text-xs font-mono font-bold transition-all',
                    i === currentStep
                      ? 'bg-brand-saffron text-white scale-110'
                      : completedSteps.has(i)
                        ? 'bg-brand-basil/80 text-white'
                        : 'glass border border-glass-border text-white/50 hover:text-white'
                  )}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
