'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Download, Moon, Sun, ChefHat } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassInput } from '@/components/ui/GlassInput'
import { GlassBadge } from '@/components/ui/GlassBadge'

export default function SettingsPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [dark, setDark] = useState(true)
  const [recipeCount, setRecipeCount] = useState<number | null>(null)
  const [collectionCount, setCollectionCount] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [profileMsg, setProfileMsg] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d) {
        setEmail((d as { email: string }).email)
        setFirstName((d as { firstName?: string }).firstName ?? '')
        setLastName((d as { lastName?: string }).lastName ?? '')
      }
    })
    fetch('/api/recipes').then(r => r.json()).then(d => {
      const recipes = Array.isArray(d) ? d : (d as { recipes: unknown[] }).recipes ?? []
      setRecipeCount(recipes.length)
    })
    fetch('/api/collections').then(r => r.json()).then(d => {
      const collections = Array.isArray(d) ? d : (d as { collections: unknown[] }).collections ?? []
      setCollectionCount(collections.length)
    })
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const logout = async () => {
    setBusy(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const saveProfile = async () => {
    setSavingProfile(true); setProfileMsg(null)
    const res = await fetch('/api/auth/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName }),
    })
    const d = await res.json()
    setProfileMsg(res.ok ? 'Profile saved' : (d.error ?? 'Failed to save'))
    setSavingProfile(false)
  }

  const exportData = async () => {
    setBusy(true)
    const res = await fetch('/api/export')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mealio-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setBusy(false)
  }

  return (
    <div className="px-6 pb-16 pt-4 max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-3xl font-bold text-white">Settings</h1>

      {/* Account */}
      <GlassCard elevated className="p-6">
        <h2 className="font-display text-xl font-bold text-white mb-4">Account</h2>
        {email ? (
          <div className="space-y-3">
            <p className="text-sm text-white/70">
              Signed in as <span className="text-white font-mono">{email}</span>
            </p>
            <div className="border-t border-white/10 pt-4 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-white/50">Profile</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <GlassInput
                    label="First name"
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <GlassInput
                    label="Last name"
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GlassButton variant="default" size="md" onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? 'Saving…' : 'Save profile'}
                </GlassButton>
                {profileMsg && (
                  <p className={profileMsg === 'Profile saved' ? 'text-sm text-emerald-300/80' : 'text-sm text-white/60'}>
                    {profileMsg}
                  </p>
                )}
              </div>
            </div>
            <GlassButton variant="danger" size="md" onClick={logout} disabled={busy}>
              <LogOut className="h-4 w-4" /> Sign out
            </GlassButton>
          </div>
        ) : (
          <p className="text-sm text-white/50">Loading…</p>
        )}
      </GlassCard>

      {/* Appearance */}
      <GlassCard elevated className="p-6">
        <h2 className="font-display text-xl font-bold text-white mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">Theme</p>
            <p className="text-xs text-white/50 mt-1">Light theme is experimental</p>
          </div>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => setDark(d => !d)}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="ml-2 text-sm">{dark ? 'Dark' : 'Light'}</span>
          </GlassButton>
        </div>
      </GlassCard>

      {/* Data */}
      <GlassCard elevated className="p-6">
        <h2 className="font-display text-xl font-bold text-white mb-4">Data</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              <span>{recipeCount ?? '…'} recipes</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📁</span>
              <span>{collectionCount ?? '…'} collections</span>
            </div>
          </div>
          <GlassButton variant="default" size="md" onClick={exportData} disabled={busy}>
            <Download className="h-4 w-4" /> Export all recipes (JSON)
          </GlassButton>
          <p className="text-xs text-white/40">Exports all recipes with ingredients, steps, tags, and collections.</p>
        </div>
      </GlassCard>

      {/* About */}
      <GlassCard elevated className="p-6">
        <h2 className="font-display text-xl font-bold text-white mb-4">About</h2>
        <div className="space-y-2 text-sm text-white/60">
          <p>Mealio <span className="font-mono text-white/40">v0.1.0</span></p>
          <p>Your personal recipe library — self-hosted, single-user, private.</p>
          <p className="text-xs text-white/30 mt-3">
            Built with Next.js, Prisma, and Tailwind CSS.
          </p>
        </div>
      </GlassCard>
    </div>
  )
}
