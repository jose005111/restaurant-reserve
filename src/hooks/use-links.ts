import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getGenericLink, rotateGenericLink } from '@/services/links'
import { useAuthStore } from '@/stores/auth-store'
import { UserRole } from '@/types/api'

export const genericLinkQueryKey = ['links', 'generic'] as const

export function useGenericLink() {
  const user = useAuthStore((state) => state.user)
  const enabled = user?.role === UserRole.ADMIN && Boolean(user.restaurantId)

  return useQuery({
    queryKey: genericLinkQueryKey,
    queryFn: getGenericLink,
    enabled,
  })
}

export function useRotateGenericLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: rotateGenericLink,
    onSuccess: (link) => {
      queryClient.setQueryData(genericLinkQueryKey, link)
    },
  })
}
