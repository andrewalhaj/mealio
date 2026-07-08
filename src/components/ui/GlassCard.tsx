'use client'

import { useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
  disableSpecular?: boolean
}

export function GlassCard({
  elevated = false,
  disableSpecular = false,
  className,
  children,
  onMouseMove,
  onMouseLeave,
  style,
  ...props
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disableSpecular || !cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      cardRef.current.style.setProperty('--specular-x', `${x}%`)
      cardRef.current.style.setProperty('--specular-y', `${y}%`)
      cardRef.current.style.setProperty('--specular-opacity', '1')
      onMouseMove?.(e)
    },
    [disableSpecular, onMouseMove],
  )

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return
      cardRef.current.style.setProperty('--specular-opacity', '0')
      onMouseLeave?.(e)
    },
    [onMouseLeave],
  )

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative overflow-hidden rounded-glass',
        'border border-glass-border',
        'transition-all duration-300 ease-glass',
        elevated
          ? 'glass-lg shadow-glass-lg'
          : 'glass shadow-glass-card',
        className,
      )}
      style={{
        '--specular-x': '50%',
        '--specular-y': '50%',
        '--specular-opacity': '0',
        ...style,
      } as React.CSSProperties}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Specular highlight that tracks cursor */}
      {!disableSpecular && (
        <div
          className="pointer-events-none absolute inset-0 rounded-glass transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 160px at var(--specular-x) var(--specular-y), rgba(255,255,255,0.12) 0%, transparent 70%)`,
            opacity: 'var(--specular-opacity)',
          }}
        />
      )}
      {children}
    </div>
  )
}
