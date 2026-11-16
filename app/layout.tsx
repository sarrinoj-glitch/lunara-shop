import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Jost } from 'next/font/google'
import { MotionProvider } from '@/components/motion/motion-provider'
import { Toaster } from '@/components/ui/sonner'
import { Intro, introScript } from '@/components/motion/intro'
import { CustomCursor } from '@/components/motion/custom-cursor'
import { siteConfig } from '@/lib/site-config'
import { publicEnv } from '@/lib/public-env'
import './globals.css'

const jost = Jost({ subsets: ['latin', 'cyrillic'], weight: ['300', '400', '500'], variable: '--font-jost', display: 'swap' })
const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  style: ['italic', 'normal'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: { default: `${siteConfig.name} — ${siteConfig.tagline}`, template: `%s — ${siteConfig.name}` },
  description: siteConfig.description,
  openGraph: { type: 'website', locale: 'ru_RU', siteName: siteConfig.name },
  // Вторая версия витрины (v2) не индексируется, чтобы не дублировать основную
  robots: process.env.NEXT_PUBLIC_NOINDEX === '1' ? { index: false, follow: false } : undefined,
}

export const viewport: Viewport = {
  themeColor: '#f6eee4',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ru" className={`${jost.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body className="min-h-dvh">
        <MotionProvider>
          <Intro />
          {children}
          <CustomCursor />
        </MotionProvider>
        <Toaster position="bottom-center" />
      </body>
    </html>
  )
}
