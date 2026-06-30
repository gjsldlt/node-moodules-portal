import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { LenisProvider } from '@/components/layout/LenisProvider'
import { NicknameProvider } from '@/components/layout/NicknameGate'
import { Header } from '@/components/layout/Header'
import AmbientBackground from '@/components/layout/AmbientBackground'
import { PageTransitionBar } from '@/components/layout/PageTransitionBar'

export const metadata: Metadata = {
  title: 'Node Moodus',
  description: 'Team hub for FED × GenAI × Mobile devs — announcements, mood, shoutouts, and games.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to Google Fonts for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {/*
          ThemeScript: runs synchronously before React hydration.
          Reads tp_theme from localStorage and sets data-theme on <html>
          to eliminate flash of wrong theme on first paint.
          Must be first child of <body> — do NOT replace with Next.js <Script>.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tp_theme');document.documentElement.dataset.theme=(t==='light')?'light':'dark';}catch(e){}})();`,
          }}
        />

        <LenisProvider>
          <ThemeProvider>
            <NicknameProvider>
              {/* Navigation progress bar — fixed, z-index 1000, above everything */}
              <PageTransitionBar />

              {/* Fixed ambient background orbs — z-index 0, below all content */}
              <AmbientBackground />

              {/* Main app shell — z-index 1, above ambient background */}
              <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header />
                {children}
              </div>
            </NicknameProvider>
          </ThemeProvider>
        </LenisProvider>
      </body>
    </html>
  )
}
