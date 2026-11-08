import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const Theme = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const

export type Theme = (typeof Theme)[keyof typeof Theme]

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

function resolveIsDark(theme: Theme): boolean {
  if (theme === Theme.DARK) {
    return true
  }

  if (theme === Theme.LIGHT) {
    return false
  }

  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: Theme.SYSTEM,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const current = get().theme
        set({ theme: resolveIsDark(current) ? Theme.LIGHT : Theme.DARK })
      },
    }),
    {
      name: 'restaurant-reserve.theme',
      partialize: ({ theme }) => ({ theme }),
    },
  ),
)

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') {
    return
  }

  const isDark = resolveIsDark(theme)
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
}
