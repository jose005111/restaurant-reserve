import { createFileRoute } from '@tanstack/react-router'
import { PublicMenuPage } from '@/components/public/public-menu'
export const Route = createFileRoute('/m/$token')({ component: MenuRoute })
function MenuRoute() {
  const { token } = Route.useParams()
  return <PublicMenuPage token={token} />
}
