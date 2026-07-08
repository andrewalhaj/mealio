'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ArrowDownToLine, Camera, Paperclip } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { CameraScanner } from '@/components/ui/CameraScanner'

export function Nav() {
  const router = useRouter()
  const [importUrl, setImportUrl] = useState('')
  const [cameraOpen, setCameraOpen] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault()
    if (!importUrl.trim()) return
    router.push(`/import?url=${encodeURIComponent(importUrl.trim())}`)
    setImportUrl('')
  }

  const handleImageFile = async (file: File) => {
    setImageUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('/api/import/image', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.error) {
        alert(data.error)
        setImageUploading(false)
        return
      }

      sessionStorage.setItem('mealio-import', JSON.stringify(data))
      window.location.assign('/import/review')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed')
      setImageUploading(false)
    } finally {
      setImageUploading(false)
    }
  }

  return (
    <nav className="sticky top-0 z-50 px-6 py-3">
      <GlassCard elevated className="flex items-center justify-between gap-4 px-6 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 font-display text-2xl font-bold tracking-tight text-white"
        >
          Mealio
        </Link>

        {/* Import field */}
        <form onSubmit={handleImport} className="relative flex-1 max-w-xl flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="Paste Instagram, YouTube, or TikTok link to import…"
              className="w-full rounded-glass-sm border border-glass-border bg-glass-white py-2.5 pl-9 pr-4 text-sm
                         text-white placeholder-white/40 outline-none transition-all duration-200
                         focus:border-glass-border-strong focus:bg-glass-white-md"
              style={{ backdropFilter: 'blur(16px)' }}
            />
          </div>

          {/* Camera / QR scan button */}
          <button
            type="button"
            aria-label="Scan QR code or link"
            title="Scan a QR code or link with your camera"
            onClick={() => setCameraOpen(true)}
            className="shrink-0 flex items-center gap-1.5 rounded-glass-sm border border-glass-border
                       bg-glass-white px-3 py-2.5 text-sm text-white/80 transition-all
                       hover:bg-glass-white-md hover:text-white"
            style={{ backdropFilter: 'blur(16px)' }}
          >
            <Camera className="h-4 w-4" />
          </button>

          {/* Image upload button */}
          <button
            type="button"
            aria-label="Upload image to import recipe"
            title="Upload an image or screenshot to import a recipe"
            onClick={() => fileInputRef.current?.click()}
            disabled={imageUploading}
            className="shrink-0 flex items-center gap-1.5 rounded-glass-sm border border-glass-border
                       bg-glass-white px-3 py-2.5 text-sm text-white/80 transition-all
                       hover:bg-glass-white-md hover:text-white disabled:opacity-40"
            style={{ backdropFilter: 'blur(16px)' }}
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <button
            type="submit"
            aria-label="Import recipe from link"
            title="Import recipe from link"
            disabled={!importUrl.trim()}
            className="shrink-0 flex items-center gap-1.5 rounded-glass-sm border border-glass-border
                       bg-glass-white px-3 py-2.5 text-sm text-white/80 transition-all
                       hover:bg-glass-white-md hover:text-white disabled:opacity-40"
            style={{ backdropFilter: 'blur(16px)' }}
          >
            <ArrowDownToLine className="h-4 w-4" />
          </button>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/meal-plan" className="hidden lg:inline text-sm text-white/60 hover:text-white transition-colors">
            Meal Plan
          </Link>
          <Link href="/collections" className="hidden lg:inline text-sm text-white/60 hover:text-white transition-colors">
            Collections
          </Link>
          <Link href="/import/history" className="hidden lg:inline text-sm text-white/60 hover:text-white transition-colors">
            History
          </Link>
          <Link href="/settings" className="hidden lg:inline text-sm text-white/60 hover:text-white transition-colors">
            Settings
          </Link>
          <ThemeToggle />
          <Link
            href="/recipes/new"
            className="inline-flex items-center gap-1.5 rounded-glass-sm border border-brand-saffron/60
                       bg-brand-saffron/20 px-4 py-2 text-sm font-medium text-white
                       transition-all hover:bg-brand-saffron/30 hover:border-brand-saffron"
          >
            + New Recipe
          </Link>
        </div>
      </GlassCard>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImageFile(file)
          e.target.value = ''
        }}
      />

      <CameraScanner
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onUrl={(url) => {
          setCameraOpen(false)
          setImportUrl(url)
          router.push('/import?url=' + encodeURIComponent(url))
        }}
      />
    </nav>
  )
}
