'use client'

import { useState, useEffect } from 'react'
import { BookmarkPlus, Check } from 'lucide-react'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassModal } from '@/components/ui/GlassModal'
import { GlassBadge } from '@/components/ui/GlassBadge'

interface Collection {
  id: string
  name: string
  recipes: { recipeId: string }[]
}

interface CollectionPickerProps {
  recipeId: string
}

export function CollectionPicker({ recipeId }: CollectionPickerProps) {
  const [open, setOpen] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCollections = async () => {
    setLoading(true)
    const res = await fetch('/api/collections')
    const data = await res.json() as Collection[]
    setCollections(data)
    setLoading(false)
  }

  useEffect(() => {
    if (open) fetchCollections()
  }, [open])

  const toggle = async (collectionId: string, inCollection: boolean) => {
    const method = inCollection ? 'DELETE' : 'POST'
    await fetch(`/api/collections/${collectionId}/recipes`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId }),
    })
    await fetchCollections()
  }

  return (
    <>
      <GlassButton variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <BookmarkPlus className="h-4 w-4" /> Add to collection
      </GlassButton>

      <GlassModal open={open} onClose={() => setOpen(false)} title="Add to Collection">
        {loading ? (
          <p className="text-white/60 text-sm py-4">Loading…</p>
        ) : collections.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-white/60 text-sm mb-3">No collections yet.</p>
            <a href="/collections" className="text-brand-saffron text-sm hover:underline">
              Create a collection →
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {collections.map(col => {
              const inCollection = col.recipes.some(r => r.recipeId === recipeId)
              return (
                <button key={col.id}
                  onClick={() => toggle(col.id, inCollection)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-glass-sm glass border border-glass-border hover:bg-glass-white-md transition-colors text-left"
                >
                  <span className="text-white font-medium">{col.name}</span>
                  {inCollection ? (
                    <GlassBadge variant="basil"><Check className="h-3 w-3 mr-1 inline" />Added</GlassBadge>
                  ) : (
                    <GlassBadge>Add</GlassBadge>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </GlassModal>
    </>
  )
}
