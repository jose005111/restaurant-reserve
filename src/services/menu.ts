import axios from 'axios'
import { api } from '@/lib/api'
import { env } from '@/lib/env'
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  MenuItem,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  MenuItemImage,
  UpdateMenuImageInput,
  PublicMenu,
  CategoryPage,
  CategoryQuery,
  MenuItemPage,
  MenuItemQuery,
} from '@/types/api'

export async function listCategories(
  params: CategoryQuery = {},
  signal?: AbortSignal,
) {
  return (await api.get<CategoryPage>('/categories', { params, signal })).data
}
export async function getCategory(id: string) {
  return (await api.get<Category>(`/categories/${id}`)).data
}
export async function listAllCategories(signal?: AbortSignal) {
  const categories: Category[] = []
  for (let page = 1; ; page++) {
    const result = await listCategories({ page, limit: 100 }, signal)
    categories.push(...result.items)
    if (page >= result.meta.totalPages) return categories
  }
}
export async function createCategory(input: CreateCategoryInput) {
  return (await api.post<Category>('/categories', input)).data
}
export async function updateCategory({
  id,
  input,
}: {
  id: string
  input: UpdateCategoryInput
}) {
  return (await api.patch<Category>(`/categories/${id}`, input)).data
}
export async function deleteCategory(id: string) {
  await api.delete(`/categories/${id}`)
}
export async function listMenuItems(
  params: MenuItemQuery = {},
  signal?: AbortSignal,
) {
  return (await api.get<MenuItemPage>('/menu-items', { params, signal })).data
}
export async function getMenuItem(id: string) {
  return (await api.get<MenuItem>(`/menu-items/${id}`)).data
}
export async function createMenuItem(input: CreateMenuItemInput) {
  return (await api.post<MenuItem>('/menu-items', input)).data
}
export async function updateMenuItem({
  id,
  input,
}: {
  id: string
  input: UpdateMenuItemInput
}) {
  return (await api.patch<MenuItem>(`/menu-items/${id}`, input)).data
}
export async function deleteMenuItem(id: string) {
  await api.delete(`/menu-items/${id}`)
}
export async function updateAvailability({
  id,
  isAvailable,
}: {
  id: string
  isAvailable: boolean
}) {
  return (
    await api.patch<MenuItem>(`/menu-items/${id}/availability`, { isAvailable })
  ).data
}
export async function uploadMenuImage({
  id,
  file,
  altText,
}: {
  id: string
  file: File
  altText: string
}) {
  const form = new FormData()
  form.append('file', file)
  form.append('altText', altText)
  return (await api.post<MenuItemImage>(`/menu-items/${id}/images`, form)).data
}
export async function updateMenuImage({
  id,
  imageId,
  input,
}: {
  id: string
  imageId: string
  input: UpdateMenuImageInput
}) {
  return (
    await api.patch<MenuItemImage>(`/menu-items/${id}/images/${imageId}`, input)
  ).data
}
export async function deleteMenuImage({
  id,
  imageId,
}: {
  id: string
  imageId: string
}) {
  await api.delete(`/menu-items/${id}/images/${imageId}`)
}
export async function reorderMenuImages({
  id,
  imageIds,
}: {
  id: string
  imageIds: string[]
}) {
  return (
    await api.patch<MenuItemImage[]>(`/menu-items/${id}/images/reorder`, {
      imageIds,
    })
  ).data
}
// Public requests do not inherit JWT or the staff 401 redirect interceptor.
export async function getPublicMenu(token: string) {
  return (
    await axios.get<PublicMenu>(
      `${env.apiUrl}/public/menu/${encodeURIComponent(token)}`,
    )
  ).data
}
