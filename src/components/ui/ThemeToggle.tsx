'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { GlassButton } from './GlassButton'

function applyTheme(dark: boolean) {
  const html = document.documentElement
  if (dark) {
    html.classList.add('dark')
    html.classList.remove('light')
  } else {
    html.classList.add('light')
    html.classList.remove('dark')
  }
}

export function ThemeToggle() {
  const [dark, setDark] = useState(true)

  // On mount, read persisted preference
  useEffect(() => {
    const stored = localStorage.getItem('mealio-theme')
    const prefersDark = stored ? stored === 'dark' : true  // default dark
    setDark(prefersDark)
    applyTheme(prefersDark)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('mealio-theme', next ? 'dark' : 'light')
    applyTheme(next)
  }

  return (
    <GlassButton
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </GlassButton>
  )
}
