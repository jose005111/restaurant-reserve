import axios from 'axios'
import type { AxiosError } from 'axios'
import { env } from '@/lib/env'
import { getAuthToken, useAuthStore } from '@/stores/auth-store'
import type { ApiErrorPayload } from '@/types/api'

export const api = axios.create({
  baseURL: env.apiUrl,
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearSession()

      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }

    return Promise.reject(error)
  },
)

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Ocorreu um erro inesperado',
): string {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const message = error.response?.data?.message

    if (Array.isArray(message)) {
      return message.join(' ')
    }

    if (message) {
      return message
    }

    if (!error.response) {
      return 'Não foi possível contactar o servidor'
    }
  }

  return fallback
}
