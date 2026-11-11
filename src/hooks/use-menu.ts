import type { CategoryQuery, MenuItemQuery } from '@/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as menu from '@/services/menu'
import { getApiErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { canManageMenu } from '@/lib/menu'

export const menuKeys = {
  staff: (tenant: string | null) => ['menu', 'staff', tenant] as const,
  categories: (tenant: string | null, params: CategoryQuery = {}) =>
    [...menuKeys.staff(tenant), 'categories', params] as const,
  items: (tenant: string | null, params: MenuItemQuery = {}) =>
    [...menuKeys.staff(tenant), 'items', params] as const,
  categoryOptions: (tenant: string | null) =>
    [...menuKeys.staff(tenant), 'category-options'] as const,
  item: (tenant: string | null, id: string | null) =>
    [...menuKeys.staff(tenant), 'item', id] as const,
  public: (token: string) => ['menu', 'public', token] as const,
}
function useCatalogAccess() {
  const user = useAuthStore((state) => state.user)
  return {
    tenant: user?.restaurantId ?? null,
    enabled: canManageMenu(user?.role) && Boolean(user?.restaurantId),
  }
}
export function useCategories(params: CategoryQuery, active = true) {
  const { tenant, enabled } = useCatalogAccess()
  return useQuery({
    queryKey: menuKeys.categories(tenant, params),
    queryFn: ({ signal }) => menu.listCategories(params, signal),
    enabled: enabled && active,
  })
}
export function useProducts(params: MenuItemQuery, active = true) {
  const { tenant, enabled } = useCatalogAccess()
  return useQuery({
    queryKey: menuKeys.items(tenant, params),
    queryFn: ({ signal }) => menu.listMenuItems(params, signal),
    enabled: enabled && active,
  })
}
export function useCategoryOptions(active = true) {
  const { tenant, enabled } = useCatalogAccess()
  return useQuery({
    queryKey: menuKeys.categoryOptions(tenant),
    queryFn: ({ signal }) => menu.listAllCategories(signal),
    enabled: enabled && active,
  })
}
export function useProductDetail(id: string | null) {
  const { tenant, enabled } = useCatalogAccess()
  return useQuery({
    queryKey: menuKeys.item(tenant, id),
    queryFn: () => menu.getMenuItem(id!),
    enabled: enabled && Boolean(id),
  })
}
export function usePublicMenu(token: string) {
  return useQuery({
    queryKey: menuKeys.public(token),
    queryFn: () => menu.getPublicMenu(token),
    retry: false,
  })
}
function useMenuMutation<T, R>(mutationFn: (input: T) => Promise<R>) {
  const client = useQueryClient()
  const tenant = useAuthStore((state) => state.user?.restaurantId ?? null)
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: menuKeys.staff(tenant) })
      void client.invalidateQueries({ queryKey: ['menu', 'public'] })
      toast.success('Menu actualizado')
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(error, 'Não foi possível actualizar o menu'),
      ),
  })
}
export function useCreateCategory() {
  return useMenuMutation(menu.createCategory)
}
export function useUpdateCategory() {
  return useMenuMutation(menu.updateCategory)
}
export function useDeleteCategory() {
  return useMenuMutation(menu.deleteCategory)
}
export function useCreateMenuItem() {
  return useMenuMutation(menu.createMenuItem)
}
export function useUpdateMenuItem() {
  return useMenuMutation(menu.updateMenuItem)
}
export function useDeleteMenuItem() {
  return useMenuMutation(menu.deleteMenuItem)
}
export function useAvailability() {
  return useMenuMutation(menu.updateAvailability)
}
export function useUploadMenuImage() {
  return useMenuMutation(menu.uploadMenuImage)
}
export function useUpdateMenuImage() {
  return useMenuMutation(menu.updateMenuImage)
}
export function useDeleteMenuImage() {
  return useMenuMutation(menu.deleteMenuImage)
}
export function useReorderMenuImages() {
  return useMenuMutation(menu.reorderMenuImages)
}
