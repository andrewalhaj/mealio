'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassInput } from '@/components/ui/GlassInput'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setBusy(true)

    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    const data = await res.json() as { error?: string }
    if (!res.ok) {
      setError(data.error ?? 'Failed to change password')
      setBusy(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <GlassCard elevated className="w-full max-w-md p-8">
        <h1 className="font-display text-3xl font-bold text-white mb-1">Choose a new password</h1>
        <p className="text-white/60 text-sm mb-6">
          As a precaution following a security review, please choose a new password.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <GlassInput
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            required
            autoFocus
          />
          <GlassInput
            label="New password"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
          <GlassInput
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
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
            {busy ? 'Working…' : 'Update password'}
          </GlassButton>
        </form>
      </GlassCard>
    </div>
  )
}
