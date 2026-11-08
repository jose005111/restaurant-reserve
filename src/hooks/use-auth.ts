import { useMutation } from '@tanstack/react-query'
import { login } from '@/services/auth'
import { useAuthStore } from '@/stores/auth-store'
import type { LoginInput } from '@/types/api'

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (session) => setSession(session),
  })
}

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession)
  return clearSession
}
