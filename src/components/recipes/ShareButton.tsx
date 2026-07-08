'use client'

import { useState } from 'react'
import { Share2, Copy, Check, Printer } from 'lucide-react'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassModal } from '@/components/ui/GlassModal'

export function ShareButton({ recipeId, shareSlug }: { recipeId: string; shareSlug: string | null }) {
  const [open, setOpen] = useState(false)
  const [slug, setSlug] = useState(shareSlug)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  const enable = async () => {
    setBusy(true)
    const res = await fetch(`/api/recipes/${recipeId}/share`, { method: 'POST' })
    const data = await res.json() as { shareSlug: string }
    setSlug(data.shareSlug); setBusy(false)
  }

  const disable = async () => {
    setBusy(true)
    await fetch(`/api/recipes/${recipeId}/share`, { method: 'DELETE' })
    setSlug(null); setBusy(false)
  }

  const shareUrl = slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${slug}` : ''

  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <GlassButton variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label="Share">
        <Share2 className="h-4 w-4" />
      </GlassButton>
      <GlassModal open={open} onClose={() => setOpen(false)} title="Share Recipe">
        <div className="space-y-4">
          {slug ? (
            <>
              <p className="text-sm text-white/70">Anyone with this link can view the recipe (read-only):</p>
              <div className="flex gap-2">
                <input readOnly value={shareUrl}
                  className="flex-1 rounded-glass-sm border border-glass-border bg-glass-white px-3 py-2 text-xs text-white outline-none font-mono"
                  onFocus={e => e.target.select()} />
                <GlassButton variant="default" size="sm" onClick={copy}>
                  {copied ? <Check className="h-4 w-4 text-brand-basil" /> : <Copy className="h-4 w-4" />}
                </GlassButton>
              </div>
              <div className="flex justify-between">
                <GlassButton variant="danger" size="sm" onClick={disable} disabled={busy}>Disable link</GlassButton>
                <a href={`/share/${slug}`} target="_blank" rel="noopener noreferrer">
                  <GlassButton variant="ghost" size="sm">Open preview</GlassButton>
                </a>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-white/70">Create a public read-only link for this recipe.</p>
              <GlassButton variant="primary" onClick={enable} disabled={busy} className="w-full">
                {busy ? 'Creating…' : 'Create share link'}
              </GlassButton>
            </>
          )}
          <div className="border-t border-glass-border pt-4">
            <p className="text-sm text-white/70 mb-2">Or export as PDF:</p>
            <GlassButton variant="default" size="sm" onClick={() => slug ? window.open(`/share/${slug}?print=1`, '_blank') : window.print()} className="w-full">
              <Printer className="h-4 w-4" /> Print / Save as PDF
            </GlassButton>
            <p className="text-xs text-white/40 mt-1">Uses your browser&apos;s print dialog — choose &quot;Save as PDF&quot;.</p>
          </div>
        </div>
      </GlassModal>
    </>
  )
}
