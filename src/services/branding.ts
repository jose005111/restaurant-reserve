import { api } from '@/lib/api'
import type {
  Branding,
  BrandingAsset,
  UpdateBrandingInput,
} from '@/types/api'

export async function getBranding(): Promise<Branding> {
  const { data } = await api.get<Branding>('/branding')
  return data
}

export async function updateBranding(
  input: UpdateBrandingInput,
): Promise<Branding> {
  const { data } = await api.patch<Branding>('/branding', input)
  return data
}

export async function uploadBrandingAsset(
  asset: BrandingAsset,
  file: File,
): Promise<Branding> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await api.put<Branding>(`/branding/${asset}`, formData)

  return data
}

export async function removeBrandingAsset(
  asset: BrandingAsset,
): Promise<void> {
  await api.delete(`/branding/${asset}`)
}
