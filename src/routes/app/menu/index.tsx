import { createFileRoute, redirect } from '@tanstack/react-router'
export const Route = createFileRoute('/app/menu/')({
  beforeLoad: () => {
    throw redirect({ to: '/app/menu/categories' })
  },
})
