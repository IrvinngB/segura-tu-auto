import type React from "react"
import { Inter, JetBrains_Mono } from "next/font/google"
import { AuthProvider } from "@/components/auth/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { AppLayout } from "@/components/layout/app-layout"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
})

export const metadata = {
  title: "SeguraTuAuto - Sistema de Gestión de Seguros",
  description: "Sistema integral para la gestión de pólizas y reclamaciones de seguros de autos",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
