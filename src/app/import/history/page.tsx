'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassBadge } from '@/components/ui/GlassBadge'
import { ExternalLink, Clock } from 'lucide-react'

interface ImportRecord {
  id: string
  url: string
  platform: string | null
  status: string
  errorMsg: string | null
  recipeId: string | null
  createdAt: string
}

const STATUS_VARIANT: Record<string, 'basil' | 'saffron' | 'tomato' | 'default'> = {
  done:       'basil',
  ready:      'basil',
  failed:     'tomato',
  structuring:'saffron',
  reading:    'saffron',
  fetching:   'default',
  pending:    'default',
}

export default function ImportHistoryPage() {
  const [history, setHistory] = useState<ImportRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/import/history')
      .then(r => r.json())
      .then((d: ImportRecord[]) => { setHistory(d); setLoading(false) })
  }, [])

  return (
    <div className="px-6 pb-16 pt-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-white">Import History</h1>
        <p className="mt-2 text-white/60">Past imports and their status.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <GlassCard key={i} className="h-20 animate-pulse" />)}
        </div>
      ) : history.length === 0 ? (
        <GlassCard className="py-16 text-center text-white/50">
          No imports yet. Paste a link in the nav to get started.
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {history.map(record => (
            <GlassCard key={record.id} className="px-5 py-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <GlassBadge variant={STATUS_VARIANT[record.status] ?? 'default'}>
                    {record.status}
                  </GlassBadge>
                  {record.platform && (
                    <GlassBadge variant="default">{record.platform}</GlassBadge>
                  )}
                </div>
                <a href={record.url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-white/70 hover:text-white flex items-center gap-1 truncate">
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  {record.url}
                </a>
                {record.errorMsg && (
                  <p className="mt-1 text-xs text-brand-tomato">{record.errorMsg}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-xs text-white/40 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(record.createdAt).toLocaleDateString()}
                </span>
                {record.recipeId && (
                  <Link href={`/recipes/${record.recipeId}`}
                    className="text-xs text-brand-saffron hover:underline">
                    View recipe →
                  </Link>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
