import axios from 'axios'
import { env } from '@/lib/env'
import type {
  CreatePublicOrderInput,
  CreatePublicOrderResult,
  PublicOrder,
} from '@/types/api'
// Public requests never attach the staff token or use staff redirect interceptors.
const publicApi = axios.create({ baseURL: env.apiUrl })
export async function createPublicOrder(input: CreatePublicOrderInput) {
  return (
    await publicApi.post<CreatePublicOrderResult>('/public/orders', input)
  ).data
}
export async function getPublicOrder(code: string) {
  return (
    await publicApi.get<PublicOrder>(
      `/public/orders/${encodeURIComponent(code)}`,
    )
  ).data
}
export async function cancelPublicOrder(code: string) {
  return (
    await publicApi.patch<PublicOrder>(
      `/public/orders/${encodeURIComponent(code)}/cancel`,
    )
  ).data
}
