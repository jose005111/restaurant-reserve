import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createRestaurant,
  listRestaurants,
  publicSignup,
} from '@/services/restaurants'
import { useAuthStore } from '@/stores/auth-store'
import { UserRole } from '@/types/api'
import type {
  CreateRestaurantInput,
  PublicSignupInput,
} from '@/types/api'

export const restaurantsQueryKey = ['restaurants'] as const

export function useRestaurants() {
  const user = useAuthStore((state) => state.user)

  return useQuery({
    queryKey: restaurantsQueryKey,
    queryFn: listRestaurants,
    enabled: user?.role === UserRole.SUPER_ADMIN,
  })
}

export function useCreateRestaurant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateRestaurantInput) => createRestaurant(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantsQueryKey })
    },
  })
}

export function usePublicSignup() {
  return useMutation({
    mutationFn: (input: PublicSignupInput) => publicSignup(input),
  })
}
