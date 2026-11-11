import { createFileRoute } from '@tanstack/react-router'
import { CatalogManager } from '@/components/menu/menu-manager'
export const Route = createFileRoute('/app/menu/categories')({
  component: () => <CatalogManager key="categories" kind="categories" />,
})
