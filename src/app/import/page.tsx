'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassInput } from '@/components/ui/GlassInput'
import { GlassToast, type ImportStep } from '@/components/ui/GlassToast'

interface ImportedData {
  importId: string
  platform: string
  sourceUrl: string
  sourceAttr: string
  extracted: {
    title?: string
    description?: string
    ingredients?: Array<{ amount?: string; unit?: string; item: string }>
    steps?: Array<{ text: string; timerMins?: number }>
    prepTime?: number
    cookTime?: number
    servings?: number
    difficulty?: string
    cuisine?: string
    tags?: string[]
    heroImage?: string
    sourceAttr?: string
  }
}

function ImportFlow() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [url, setUrl] = useState(searchParams.get('url') ?? '')
  const [toastStep, setToastStep] = useState<ImportStep>('fetching')
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  const hasAutoStarted = useRef(false)

  const runImport = async (targetUrl: string) => {
    if (!targetUrl.trim()) return
    setRunning(true)
    setError('')
    setToastStep('fetching')
    setToastMsg('Reaching out to the source…')
    setToastVisible(true)

    try {
      // Poll progress via status while POST runs
      let importId: string | null = null

      // Start the import
      const importPromise = fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      })

      // Poll for status updates while waiting
      const pollInterval = setInterval(async () => {
        if (!importId) return
        try {
          const res = await fetch(`/api/import/status?id=${importId}`)
          const data = await res.json() as { status: string }
          const stepMap: Record<string, ImportStep> = {
            fetching: 'fetching',
            reading: 'reading',
            structuring: 'structuring',
            done: 'ready',
            failed: 'error',
          }
          if (data.status in stepMap) setToastStep(stepMap[data.status] ?? 'fetching')
        } catch { /* ignore poll errors */ }
      }, 800)

      const res = await importPromise
      clearInterval(pollInterval)

      const data = await res.json() as ImportedData & { error?: string }

      if (!res.ok || data.error) {
        setToastStep('error')
        setToastMsg(data.error ?? 'Import failed')
        setError(data.error ?? 'Import failed')
        setRunning(false)
        return
      }

      importId = data.importId
      setToastStep('ready')
      setToastMsg('Recipe extracted! Redirecting to review…')

      // Store extracted data in sessionStorage for the review page
      sessionStorage.setItem('mealio-import', JSON.stringify(data))

      setTimeout(() => {
        router.push('/import/review')
      }, 800)
    } catch (err) {
      setToastStep('error')
      const msg = err instanceof Error ? err.message : 'Import failed'
      setToastMsg(msg)
      setError(msg)
      setRunning(false)
    }
  }

  // Auto-start if URL came from nav
  useEffect(() => {
    const paramUrl = searchParams.get('url')
    if (paramUrl && !hasAutoStarted.current) {
      hasAutoStarted.current = true
      setUrl(paramUrl)
      runImport(paramUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="px-6 pb-16 pt-8 max-w-2xl mx-auto">
      <h1 className="font-display text-4xl font-bold text-white mb-2">Import Recipe</h1>
      <p className="text-white/60 mb-8">Paste a link from Instagram, YouTube, TikTok, or any recipe site.</p>

      <GlassCard elevated className="p-8 mb-6">
        <form onSubmit={e => { e.preventDefault(); runImport(url) }} className="space-y-4">
          <GlassInput
            label="Recipe URL"
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@chef/video/…"
            disabled={running}
          />
          {error && (
            <div className="rounded-glass-sm border border-brand-tomato/50 bg-brand-tomato/10 px-4 py-3 text-sm text-brand-tomato">
              {error}
            </div>
          )}
          <GlassButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={running || !url.trim()}
          >
            {running ? 'Importing…' : 'Import Recipe'}
          </GlassButton>
        </form>
      </GlassCard>

      {/* Supported platforms */}
      <div className="flex flex-wrap gap-3 text-sm text-white/50">
        <span className="font-medium text-white/70">Supported:</span>
        {['TikTok', 'Instagram', 'YouTube', 'AllRecipes', 'NYT Cooking', 'Any recipe site'].map(p => (
          <span key={p} className="rounded-full border border-glass-border px-3 py-0.5 text-xs">{p}</span>
        ))}
      </div>

      {/* Import toast */}
      <GlassToast step={toastStep} message={toastMsg} visible={toastVisible} />
    </div>
  )
}

export default function ImportPage() {
  return (
    <Suspense fallback={
      <div className="px-6 pb-16 pt-8 max-w-2xl mx-auto">
        <GlassCard className="p-12 text-center text-white/60">Loading import…</GlassCard>
      </div>
    }>
      <ImportFlow />
    </Suspense>
  )
}
