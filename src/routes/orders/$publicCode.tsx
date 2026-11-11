import { createFileRoute } from '@tanstack/react-router'
import { PublicOrderPage } from '@/components/public/public-order'
export const Route = createFileRoute('/orders/$publicCode')({
  component: OrderRoute,
})
function OrderRoute() {
  const { publicCode } = Route.useParams()
  return <PublicOrderPage publicCode={publicCode} />
}
