import type { Metadata } from 'next'
import { Playfair_Display, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { AmbientBlobs } from '@/components/ui/AmbientBlobs'
import { Nav } from '@/components/layout/Nav'
import { MinimalHeader } from '@/components/layout/MinimalHeader'
import { getSessionUserId } from '@/lib/auth'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mealio',
  description: 'Your personal recipe library',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId()

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('mealio-theme');var d=t?t==='dark':true;document.documentElement.classList.add(d?'dark':'light');})();`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <AmbientBlobs />
        {userId ? <Nav /> : <MinimalHeader />}
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  )
}
