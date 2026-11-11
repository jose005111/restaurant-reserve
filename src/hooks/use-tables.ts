import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTable,
  deleteTable,
  getTableQr,
  listTables,
  rotateTableToken,
  updateTable,
} from '@/services/tables'
import { useAuthStore } from '@/stores/auth-store'
import { UserRole } from '@/types/api'
import type { CreateTableInput, UpdateTableInput } from '@/types/api'

export const tablesQueryKey = ['tables'] as const

export function tableQrQueryKey(id: string) {
  return ['tables', id, 'qr'] as const
}

function useIsRestaurantAdmin() {
  const user = useAuthStore((state) => state.user)
  return user?.role === UserRole.ADMIN && Boolean(user.restaurantId)
}

export function useTables() {
  const enabled = useIsRestaurantAdmin()

  return useQuery({
    queryKey: tablesQueryKey,
    queryFn: listTables,
    enabled,
  })
}

export function useTableQr(id: string, enabled: boolean) {
  return useQuery({
    queryKey: tableQrQueryKey(id),
    queryFn: () => getTableQr(id),
    enabled,
  })
}

export function useCreateTable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTableInput) => createTable(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tablesQueryKey })
    },
  })
}

export function useUpdateTable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: UpdateTableInput
    }) => updateTable(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tablesQueryKey })
    },
  })
}

export function useDeleteTable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tablesQueryKey })
    },
  })
}

export function useRotateTableToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => rotateTableToken(id),
    onSuccess: (_table, id) => {
      queryClient.invalidateQueries({ queryKey: tablesQueryKey })
      queryClient.invalidateQueries({ queryKey: tableQrQueryKey(id) })
    },
  })
}
