'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassInput } from '@/components/ui/GlassInput'
import Link from 'next/link'

export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [resetUrl, setResetUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setResetUrl(null)

    const res = await fetch('/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json() as { message?: string; resetUrl?: string | null; error?: string }

    if (!res.ok) {
      setError(data.error ?? 'Failed to request password reset')
      setBusy(false)
      return
    }

    if (data.resetUrl) {
      setResetUrl(data.resetUrl)
    }
    setBusy(false)
  }

  const copyToClipboard = () => {
    if (resetUrl) {
      const fullUrl = `${window.location.origin}${resetUrl}`
      navigator.clipboard.writeText(fullUrl)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <GlassCard elevated className="w-full max-w-md p-8">
        <h1 className="font-display text-3xl font-bold text-white mb-1">Reset password</h1>
        <p className="text-white/60 text-sm mb-6">
          Enter your email address and we'll send you a reset link.
        </p>

        {!resetUrl ? (
          <form onSubmit={submit} className="space-y-4">
            <GlassInput
              label="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
            {error && <p className="text-sm text-brand-tomato">{error}</p>}
            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={busy}
            >
              {busy ? 'Working…' : 'Send reset link'}
            </GlassButton>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-white/10 border border-white/20 rounded-lg p-4">
              <p className="text-sm text-white/70 mb-3">Your password reset link:</p>
              <code className="block bg-black/30 p-3 rounded text-xs text-brand-saffron break-all mb-3">
                {resetUrl}
              </code>
              <button
                onClick={copyToClipboard}
                className="w-full px-3 py-2 bg-brand-saffron/20 hover:bg-brand-saffron/30 border border-brand-saffron/50 rounded text-sm text-brand-saffron transition-colors"
              >
                Copy link
              </button>
              <p className="text-xs text-white/50 mt-3">
                This link expires in 1 hour and can only be used once.
              </p>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-white/50 mt-6">
          Remember your password?{' '}
          <Link href="/login" className="text-brand-saffron hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </GlassCard>
    </div>
  )
}
