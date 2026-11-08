import { api } from '@/lib/api'
import type { GenericLink } from '@/types/api'

export async function getGenericLink(): Promise<GenericLink> {
  const { data } = await api.get<GenericLink>('/links/generic')
  return data
}

export async function rotateGenericLink(): Promise<GenericLink> {
  const { data } = await api.post<GenericLink>('/links/generic/rotate')
  return data
}
