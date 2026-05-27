import { useEffect } from 'react'
import { env } from '@/config/env'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--accent-color', env.client.accentColor)
  }, [])

  return <>{children}</>
}
