import { createFileRoute } from '@tanstack/react-router'
import { CatalogManager } from '@/components/menu/menu-manager'
export const Route = createFileRoute('/app/menu/products')({
  component: () => <CatalogManager key="products" kind="products" />,
})
