import { UserRole } from '@/types/api'
import type { MenuItem } from '@/types/api'
export function canManageMenu(role: UserRole | undefined) {
  return role === UserRole.ADMIN
}
export function filterMenuItems(
  items: MenuItem[],
  search: string,
  category: string,
) {
  return items.filter(
    (item) =>
      (!category || item.categoryId === category) &&
      item.name
        .toLocaleLowerCase('pt')
        .includes(search.trim().toLocaleLowerCase('pt')),
  )
}
