import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthResponse, AuthUser } from '@/types/api'

interface AuthState {
  token: string | null
  user: AuthUser | null
  setSession: (session: AuthResponse) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: ({ accessToken, user }) =>
        set({ token: accessToken, user }),
      clearSession: () => set({ token: null, user: null }),
    }),
    {
      name: 'restaurant-reserve.auth',
      partialize: ({ token, user }) => ({ token, user }),
    },
  ),
)

export function getAuthToken(): string | null {
  return useAuthStore.getState().token
}
