'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard } from './GlassCard'
import { GlassButton } from './GlassButton'

interface GlassModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function GlassModal({ open, onClose, title, children, className }: GlassModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <GlassCard
        elevated
        className={cn('relative z-10 w-full max-w-lg animate-toast-in', className)}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-glass-border px-6 py-4">
            <h2 className="font-display text-xl font-bold text-white">{title}</h2>
            <GlassButton variant="ghost" size="sm" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </GlassButton>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </GlassCard>
    </div>
  )
}
