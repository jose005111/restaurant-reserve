import { useEffect } from 'react'
import { useLocation } from '@tanstack/react-router'
import { applyTheme, useThemeStore } from '@/stores/theme-store'

export function ThemeManager() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    if (pathname.startsWith('/m/')) return
    applyTheme(theme)

    if (theme !== 'system') {
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme, pathname])

  return null
}
