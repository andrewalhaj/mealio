'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassInput } from '@/components/ui/GlassInput'
import Link from 'next/link'

export default function ResetPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('No reset token provided. Please use the link from your email.')
    }
  }, [token])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== passwordConfirm) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setBusy(true)

    const res = await fetch('/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password }),
    })

    const data = await res.json() as { message?: string; error?: string }

    if (!res.ok) {
      setError(data.error ?? 'Failed to reset password')
      setBusy(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }

  if (!token) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <GlassCard elevated className="w-full max-w-md p-8">
          <h1 className="font-display text-3xl font-bold text-white mb-1">Reset password</h1>
          <p className="text-brand-tomato text-sm mt-4">{error}</p>
          <p className="text-center text-sm text-white/50 mt-6">
            <Link href="/login" className="text-brand-saffron hover:underline font-medium">
              Return to sign in
            </Link>
          </p>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <GlassCard elevated className="w-full max-w-md p-8">
        <h1 className="font-display text-3xl font-bold text-white mb-1">Create new password</h1>
        <p className="text-white/60 text-sm mb-6">Enter your new password below.</p>

        {success ? (
          <div className="space-y-4">
            <p className="text-brand-saffron text-sm font-medium">Password updated successfully!</p>
            <p className="text-white/60 text-sm">Redirecting to sign in…</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <GlassInput
              label="New password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
            />
            <GlassInput
              label="Confirm password"
              type="password"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              required
            />
            <p className="text-xs text-white/50">Minimum 8 characters</p>
            {error && <p className="text-sm text-brand-tomato">{error}</p>}
            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={busy}
            >
              {busy ? 'Working…' : 'Set new password'}
            </GlassButton>
          </form>
        )}

        <p className="text-center text-sm text-white/50 mt-6">
          <Link href="/login" className="text-brand-saffron hover:underline font-medium">
            Back to sign in
          </Link>
        </p>
      </GlassCard>
    </div>
  )
}
