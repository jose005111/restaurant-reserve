import {
  Eye,
  Pencil,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react'
import { useAvailability, useProductDetail } from '@/hooks/use-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { CatalogAction } from './catalog-action'
import { CatalogDelete } from './catalog-dialog'
import { MenuImages } from './menu-images'
import type { MenuItem } from '@/types/api'
export function ProductDetails({
  id,
  categoryName,
  canEdit,
  onEdit,
  onDelete,
}: {
  id: string
  categoryName: (id: string) => string
  canEdit: boolean
  onEdit: (item: MenuItem) => void
  onDelete: (id: string) => Promise<void>
}) {
  const detail = useProductDetail(id),
    availability = useAvailability()
  if (detail.isPending)
    return <Skeleton className="h-64 w-full" aria-label="A carregar detalhes" />
  if (detail.isError || !detail.data)
    return (
      <div role="alert" className="space-y-3">
        <p>Não foi possível carregar os detalhes.</p>
        <CatalogAction
          icon={RefreshCw}
          label="Tentar carregar detalhes novamente"
          onClick={() => void detail.refetch()}
        />
      </div>
    )
  const item = detail.data
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Eye className="size-5" />
          {item.name}
        </h2>
        <Badge variant={item.isAvailable ? 'default' : 'secondary'}>
          {item.isAvailable ? 'Disponível' : 'Indisponível'}
        </Badge>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted-foreground">Identificador</dt>
        <dd className="break-all">{item.id}</dd>
        <dt className="text-muted-foreground">Categoria</dt>
        <dd>{categoryName(item.categoryId)}</dd>
        <dt className="text-muted-foreground">Descrição</dt>
        <dd className="whitespace-pre-line">
          {item.description || 'Sem descrição'}
        </dd>
        <dt className="text-muted-foreground">Preço</dt>
        <dd>
          {(item.priceCents / 100).toLocaleString('pt-AO', {
            minimumFractionDigits: 2,
          })}{' '}
          na moeda do restaurante ({item.priceCents} cêntimos)
        </dd>
        <dt className="text-muted-foreground">Ordem</dt>
        <dd>{item.sortOrder}</dd>
        <dt className="text-muted-foreground">Criado</dt>
        <dd>{new Date(item.createdAt).toLocaleString('pt-AO')}</dd>
        <dt className="text-muted-foreground">Actualizado</dt>
        <dd>{new Date(item.updatedAt).toLocaleString('pt-AO')}</dd>
      </dl>
      <div className="flex flex-wrap gap-2">
        <CatalogAction
          icon={Pencil}
          label="Editar produto"
          variant="outline"
          disabled={!canEdit}
          onClick={() => onEdit(item)}
        />
        <CatalogAction
          icon={item.isAvailable ? ToggleRight : ToggleLeft}
          label={
            item.isAvailable
              ? 'Marcar produto indisponível'
              : 'Marcar produto disponível'
          }
          disabled={availability.isPending}
          variant="outline"
          onClick={() =>
            availability.mutate({ id: item.id, isAvailable: !item.isAvailable })
          }
        />
        <CatalogDelete
          title={`Eliminar ${item.name}?`}
          description="A eliminação é permanente. Produtos associados a pedidos não podem ser eliminados."
          trigger={
            <CatalogAction
              icon={Trash2}
              label="Eliminar produto"
              variant="destructive"
            />
          }
          onConfirm={() => onDelete(item.id)}
        />
      </div>
      <section
        className="space-y-3 border-t pt-5"
        aria-label="Galeria do produto"
      >
        <h3 className="text-lg font-semibold">
          Imagens ({item.images.length})
        </h3>
        {item.images.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Este produto ainda não tem imagens.
          </p>
        )}
        <MenuImages item={item} />
      </section>
    </div>
  )
}
