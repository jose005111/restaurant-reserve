import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getBranding,
  removeBrandingAsset,
  updateBranding,
  uploadBrandingAsset,
} from '@/services/branding'
import { useAuthStore } from '@/stores/auth-store'
import { UserRole } from '@/types/api'
import type { BrandingAsset, UpdateBrandingInput } from '@/types/api'

export const brandingQueryKey = ['branding'] as const

export function useBranding() {
  const user = useAuthStore((state) => state.user)

  return useQuery({
    queryKey: brandingQueryKey,
    queryFn: getBranding,
    enabled:
      Boolean(user?.restaurantId) && user?.role !== UserRole.SUPER_ADMIN,
  })
}

export function useUpdateBranding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateBrandingInput) => updateBranding(input),
    onSuccess: (branding) => {
      queryClient.setQueryData(brandingQueryKey, branding)
    },
  })
}

export function useUploadBrandingAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ asset, file }: { asset: BrandingAsset; file: File }) =>
      uploadBrandingAsset(asset, file),
    onSuccess: (branding) => {
      queryClient.setQueryData(brandingQueryKey, branding)
    },
  })
}

export function useRemoveBrandingAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (asset: BrandingAsset) => removeBrandingAsset(asset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandingQueryKey })
    },
  })
}
