import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from '@/services/users'
import { useAuthStore } from '@/stores/auth-store'
import { UserRole } from '@/types/api'
import type { CreateUserInput, UpdateUserInput } from '@/types/api'

export const usersQueryKey = ['users'] as const

function useIsRestaurantAdmin() {
  const user = useAuthStore((state) => state.user)
  return user?.role === UserRole.ADMIN && Boolean(user.restaurantId)
}

export function useUsers() {
  const enabled = useIsRestaurantAdmin()

  return useQuery({
    queryKey: usersQueryKey,
    queryFn: listUsers,
    enabled,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: UpdateUserInput
    }) => updateUser(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey })
    },
  })
}
