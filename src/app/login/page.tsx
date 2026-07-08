'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import Link from 'next/link'
import { GlassInput } from '@/components/ui/GlassInput'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [setupNeeded, setSetupNeeded] = useState<boolean | null>(null)
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/auth/setup')
      .then(r => r.json())
      .then((d: { setupNeeded: boolean }) => {
        setSetupNeeded(d.setupNeeded)
        if (d.setupNeeded) setMode('signup')
      })
  }, [])

  const toggleMode = () => {
    setMode(prev => (prev === 'signin' ? 'signup' : 'signin'))
    setError('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')

    const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mode === 'signup' ? { email, password, firstName, lastName } : { email, password }),
    })
    const data = await res.json() as { error?: string; mustReset?: boolean }
    if (!res.ok) {
      setError(data.error ?? 'Failed')
      setBusy(false)
      return
    }
    if (data.mustReset) {
      router.push('/reset-password')
    } else {
      router.push('/')
    }
    router.refresh()
  }

  const isFirstRun = setupNeeded === true

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <GlassCard elevated className="w-full max-w-md p-8">
        <h1 className="font-display text-3xl font-bold text-white mb-1">
          {setupNeeded === null
            ? 'Mealio'
            : mode === 'signup'
              ? 'Create your account'
              : 'Sign in'}
        </h1>
        <p className="text-white/60 text-sm mb-6">
          {isFirstRun
            ? 'Welcome to Mealio — create your account to get started.'
            : mode === 'signup'
              ? 'Create a new account to start your recipe library.'
              : 'Sign in to your recipe library.'}
        </p>
        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <GlassInput
                  label="First name"
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="flex-1">
                <GlassInput
                  label="Last name"
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}
          <GlassInput
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
          <GlassInput
            label={mode === 'signup' ? 'Password' : 'Password'}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {mode === 'signup' && (
            <p className="text-xs text-white/50 -mt-2">Minimum 8 characters</p>
          )}
          {error && <p className="text-sm text-brand-tomato">{error}</p>}
          <GlassButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={busy || setupNeeded === null}
          >
            {busy ? 'Working…' : mode === 'signup' ? 'Sign up' : 'Sign in'}
          </GlassButton>
          {mode === 'signin' && (
            <Link href="/forgot" className="block text-center text-sm text-brand-saffron hover:underline">
              Forgot password?
            </Link>
          )}
        </form>
        <p className="text-center text-sm text-white/50 mt-6">
          {mode === 'signin' ? (
            <>
              No account?{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-brand-saffron hover:underline font-medium"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-brand-saffron hover:underline font-medium"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </GlassCard>
    </div>
  )
}
