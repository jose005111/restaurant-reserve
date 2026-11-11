import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { canManageMenu } from '@/lib/menu'

export const Route = createFileRoute('/app/menu')({
  beforeLoad: () => {
    if (!canManageMenu(useAuthStore.getState().user?.role))
      throw redirect({ to: '/app' })
  },
  component: Outlet,
})
