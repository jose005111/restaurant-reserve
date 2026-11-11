import { ChevronLeft, ChevronRight, ListFilter } from 'lucide-react'
import { CatalogAction } from './catalog-action'
import { CatalogFilter } from './catalog-filter'
import type { PaginationMeta } from '@/types/api'

export function CatalogPagination({
  meta,
  page,
  limit,
  busy,
  onPage,
  onLimit,
}: {
  meta?: PaginationMeta
  page: number
  limit: number
  busy: boolean
  onPage: (page: number) => void
  onLimit: (limit: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t bg-muted/20 p-4">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {meta?.total ?? 0} registos · Página {page} de{' '}
        {Math.max(1, meta?.totalPages ?? 0)}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <CatalogFilter
          icon={ListFilter}
          label="Registos por página"
          tooltip="Alterar o número de registos por página"
        >
          <select
            aria-label="Registos por página"
            className="h-9 rounded-md border bg-background px-2"
            value={limit}
            onChange={(event) => onLimit(Number(event.target.value))}
          >
            {[10, 20, 50, 100].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </CatalogFilter>
        <CatalogAction
          icon={ChevronLeft}
          label="Página anterior"
          variant="outline"
          disabled={busy || page <= 1}
          onClick={() => onPage(page - 1)}
        />
        <CatalogAction
          icon={ChevronRight}
          label="Página seguinte"
          variant="outline"
          disabled={busy || !meta || page >= meta.totalPages}
          onClick={() => onPage(page + 1)}
        />
      </div>
    </div>
  )
}
