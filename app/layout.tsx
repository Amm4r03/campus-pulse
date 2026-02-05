import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { validateEnv } from "@/lib/env"
import "./globals.css"

// Log missing env vars on server (non-blocking; does not throw)
validateEnv()

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Campus Pulse",
    template: "%s | Campus Pulse",
  },
  description: "Centralized issue triage and reporting portal for Jamia Hamdard. Report campus issues, track progress, and get faster resolutions.",
  keywords: ["campus", "issues", "jamia hamdard", "reporting", "triage", "student portal"],
  authors: [{ name: "Campus Pulse Team" }],
  creator: "Campus Pulse",
  metadataBase: new URL("https://campuspulse.in"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://campuspulse.in",
    title: "Campus Pulse",
    description: "Report campus issues. Get them resolved.",
    siteName: "Campus Pulse",
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Pulse",
    description: "Report campus issues. Get them resolved.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
