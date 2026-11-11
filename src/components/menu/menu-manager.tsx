import { useState } from 'react'
import {
  Eye,
  Pencil,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  FolderOpen,
  Package,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { CatalogAction } from './catalog-action'
import { CatalogDelete, CatalogDialog } from './catalog-dialog'
import { CatalogFilter } from './catalog-filter'
import { CatalogPagination } from './catalog-pagination'
import { CategoryForm, MenuItemForm } from './menu-forms'
import { ProductDetails } from './product-details'
import {
  useAvailability,
  useCategories,
  useCategoryOptions,
  useDeleteCategory,
  useDeleteMenuItem,
  useProducts,
} from '@/hooks/use-menu'
import type { Category, MenuItem } from '@/types/api'

export function CatalogManager({ kind }: { kind: 'categories' | 'products' }) {
  const isCategory = kind === 'categories'
  const [page, setPage] = useState(1),
    [limit, setLimit] = useState(20)
  const [draft, setDraft] = useState(''),
    [search, setSearch] = useState(''),
    [status, setStatus] = useState(''),
    [categoryId, setCategoryId] = useState('')
  const categories = useCategories(
    {
      page,
      limit,
      search: search || undefined,
      isActive: status === '' ? undefined : status === 'true',
    },
    isCategory,
  )
  const products = useProducts(
    {
      page,
      limit,
      search: search || undefined,
      isAvailable: status === '' ? undefined : status === 'true',
      categoryId: categoryId || undefined,
    },
    !isCategory,
  )
  const options = useCategoryOptions(!isCategory)
  const query = isCategory ? categories : products
  const [categoryEdit, setCategoryEdit] = useState<Category | 'new' | null>(
      null,
    ),
    [productEdit, setProductEdit] = useState<MenuItem | 'new' | null>(null)
  const [categoryDetail, setCategoryDetail] = useState<Category | null>(null),
    [productDetailId, setProductDetailId] = useState<string | null>(null)
  const removeCategory = useDeleteCategory(),
    removeProduct = useDeleteMenuItem(),
    availability = useAvailability()
  const clear = () => {
    setDraft('')
    setSearch('')
    setStatus('')
    setCategoryId('')
    setPage(1)
  }
  const deletedProduct = async (id: string) => {
    await removeProduct.mutateAsync(id)
    setProductDetailId(null)
    setPage(1)
  }
  const categoryName = (id: string) =>
    options.data?.find((category) => category.id === id)?.name ??
    'Categoria não encontrada'
  const title = isCategory ? 'Categorias' : 'Produtos'
  const totalColumns = isCategory ? 5 : 6
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">
            Menu
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            {isCategory ? (
              <FolderOpen className="size-6" />
            ) : (
              <Package className="size-6" />
            )}
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isCategory
              ? 'Organiza as secções do menu e a sua visibilidade.'
              : 'Gere comida, bebidas e outros consumíveis do restaurante.'}
          </p>
        </div>
        <CatalogAction
          icon={Plus}
          label={isCategory ? 'Criar categoria' : 'Criar produto'}
          disabled={
            !isCategory && (!options.data?.length || options.isFetching)
          }
          onClick={() =>
            isCategory ? setCategoryEdit('new') : setProductEdit('new')
          }
        />
      </header>
      {!isCategory && options.isError && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 p-4"
        >
          <p>Não foi possível carregar as categorias.</p>
          <CatalogAction
            icon={RefreshCw}
            label="Tentar carregar categorias novamente"
            variant="outline"
            onClick={() => void options.refetch()}
          />
        </div>
      )}
      {!isCategory && options.data?.length === 0 && (
        <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          Cria uma categoria no submenu Categorias antes de adicionares
          produtos.
        </p>
      )}
      <section
        className="overflow-hidden rounded-xl border bg-card shadow-sm"
        aria-label={`Lista de ${title.toLowerCase()}`}
      >
        <form
          className="flex flex-wrap items-end gap-3 border-b bg-muted/20 p-4"
          onSubmit={(event) => {
            event.preventDefault()
            setSearch(draft.trim())
            setPage(1)
          }}
        >
          <div className="min-w-48 flex-1">
            <CatalogFilter
              icon={Search}
              label={`Pesquisar ${title.toLowerCase()}`}
              tooltip="Pesquisar pelo nome no catálogo completo"
            >
              <Input
                id="catalog-search"
                aria-label={`Pesquisar ${title.toLowerCase()}`}
                maxLength={100}
                placeholder="Nome..."
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </CatalogFilter>
          </div>
          {!isCategory && (
            <CatalogFilter
              icon={FolderOpen}
              label="Categoria"
              tooltip="Filtrar produtos por categoria"
            >
              <select
                id="catalog-category"
                aria-label="Filtrar por categoria"
                className="h-9 rounded-md border bg-background px-3"
                disabled={options.isPending || options.isError}
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">Todas as categorias</option>
                {options.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {category.isActive ? '' : ' (inactiva)'}
                  </option>
                ))}
              </select>
            </CatalogFilter>
          )}
          <CatalogFilter
            icon={Filter}
            label="Estado"
            tooltip={
              isCategory
                ? 'Filtrar categorias activas ou inactivas'
                : 'Filtrar produtos disponíveis ou indisponíveis'
            }
          >
            <select
              id="catalog-status"
              aria-label="Filtrar por estado"
              className="h-9 rounded-md border bg-background px-3"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setPage(1)
              }}
            >
              <option value="">Todos os estados</option>
              <option value="true">
                {isCategory ? 'Activas' : 'Disponíveis'}
              </option>
              <option value="false">
                {isCategory ? 'Inactivas' : 'Indisponíveis'}
              </option>
            </select>
          </CatalogFilter>
          <CatalogAction
            icon={Search}
            label="Aplicar pesquisa"
            type="submit"
            variant="outline"
          />
          <CatalogAction
            icon={RotateCcw}
            label="Limpar filtros"
            variant="ghost"
            onClick={clear}
          />
        </form>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="pl-4">Nome</TableHead>
              {!isCategory && <TableHead>Categoria</TableHead>}
              <TableHead>
                {isCategory ? 'Estado' : 'Preço (moeda do restaurante)'}
              </TableHead>
              <TableHead>{isCategory ? 'Ordem' : 'Disponibilidade'}</TableHead>
              <TableHead>{isCategory ? 'Actualizada' : 'Ordem'}</TableHead>
              <TableHead className="pr-4 text-right">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isPending ? (
              <TableRow>
                <TableCell colSpan={totalColumns}>
                  <div
                    role="status"
                    aria-label="A carregar catálogo"
                    className="space-y-3 py-4"
                  >
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </TableCell>
              </TableRow>
            ) : query.isError ? (
              <TableRow>
                <TableCell colSpan={totalColumns}>
                  <div role="alert" className="space-y-3 py-6 text-center">
                    <p>Não foi possível carregar o catálogo.</p>
                    <CatalogAction
                      icon={RefreshCw}
                      label="Tentar carregar catálogo novamente"
                      variant="outline"
                      onClick={() => void query.refetch()}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ) : query.data?.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={totalColumns}
                  className="py-12 text-center text-muted-foreground"
                >
                  Nenhum registo encontrado. Ajusta os filtros ou cria um
                  registo.
                </TableCell>
              </TableRow>
            ) : isCategory ? (
              categories.data?.items.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="pl-4 font-medium">
                    {category.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={category.isActive ? 'default' : 'secondary'}
                    >
                      {category.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableCell>
                  <TableCell>{category.sortOrder}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(category.updatedAt).toLocaleDateString('pt-AO')}
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      <CatalogAction
                        icon={Eye}
                        label={`Ver detalhes de ${category.name}`}
                        iconOnly
                        size="icon"
                        variant="ghost"
                        onClick={() => setCategoryDetail(category)}
                      />
                      <CatalogAction
                        icon={Pencil}
                        label={`Editar ${category.name}`}
                        iconOnly
                        size="icon"
                        variant="ghost"
                        onClick={() => setCategoryEdit(category)}
                      />
                      <CatalogDelete
                        title={`Eliminar ${category.name}?`}
                        description="Só é possível eliminar categorias sem produtos."
                        trigger={
                          <CatalogAction
                            icon={Trash2}
                            label={`Eliminar ${category.name}`}
                            iconOnly
                            size="icon"
                            variant="destructive"
                          />
                        }
                        onConfirm={async () => {
                          await removeCategory.mutateAsync(category.id)
                          setPage(1)
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              products.data?.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="pl-4 font-medium">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {categoryName(item.categoryId)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {(item.priceCents / 100).toLocaleString('pt-AO', {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.isAvailable ? 'default' : 'secondary'}>
                      {item.isAvailable ? 'Disponível' : 'Indisponível'}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.sortOrder}</TableCell>
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      <CatalogAction
                        icon={Eye}
                        label={`Ver detalhes de ${item.name}`}
                        id={`view-product-${item.id}`}
                        iconOnly
                        size="icon"
                        variant="ghost"
                        onClick={() => setProductDetailId(item.id)}
                      />
                      <CatalogAction
                        icon={Pencil}
                        label={`Editar ${item.name}`}
                        iconOnly
                        size="icon"
                        variant="ghost"
                        disabled={options.isPending || options.isError}
                        onClick={() => setProductEdit(item)}
                      />
                      <CatalogAction
                        icon={item.isAvailable ? ToggleRight : ToggleLeft}
                        label={`${item.isAvailable ? 'Marcar indisponível' : 'Marcar disponível'}: ${item.name}`}
                        iconOnly
                        size="icon"
                        variant="ghost"
                        disabled={availability.isPending}
                        onClick={() =>
                          availability.mutate({
                            id: item.id,
                            isAvailable: !item.isAvailable,
                          })
                        }
                      />
                      <CatalogDelete
                        title={`Eliminar ${item.name}?`}
                        description="Produtos associados a pedidos não podem ser eliminados; marca-os como indisponíveis."
                        trigger={
                          <CatalogAction
                            icon={Trash2}
                            label={`Eliminar ${item.name}`}
                            iconOnly
                            size="icon"
                            variant="destructive"
                          />
                        }
                        onConfirm={() => deletedProduct(item.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <CatalogPagination
          meta={query.data?.meta}
          page={page}
          limit={limit}
          busy={query.isFetching}
          onPage={setPage}
          onLimit={(value) => {
            setLimit(value)
            setPage(1)
          }}
        />
      </section>
      <CatalogDialog
        open={Boolean(categoryEdit)}
        onOpenChange={(open) => {
          if (!open) setCategoryEdit(null)
        }}
        title={categoryEdit === 'new' ? 'Criar categoria' : 'Editar categoria'}
        description="Define o nome, a ordem e a visibilidade da categoria."
      >
        {categoryEdit && (
          <CategoryForm
            category={categoryEdit === 'new' ? undefined : categoryEdit}
            onDone={() => {
              setCategoryEdit(null)
              setPage(1)
            }}
          />
        )}
      </CatalogDialog>
      <CatalogDialog
        open={Boolean(productEdit)}
        onOpenChange={(open) => {
          if (!open) setProductEdit(null)
        }}
        fallbackFocusId={
          productEdit && productEdit !== 'new'
            ? `view-product-${productEdit.id}`
            : undefined
        }
        title={productEdit === 'new' ? 'Criar produto' : 'Editar produto'}
        description="Configura comida, bebidas ou outros consumíveis."
      >
        {productEdit && (
          <MenuItemForm
            item={productEdit === 'new' ? undefined : productEdit}
            categories={options.data ?? []}
            onDone={() => {
              setProductEdit(null)
              setPage(1)
            }}
          />
        )}
      </CatalogDialog>
      <CatalogDialog
        open={Boolean(categoryDetail)}
        onOpenChange={(open) => {
          if (!open) setCategoryDetail(null)
        }}
        title={categoryDetail?.name ?? 'Detalhes da categoria'}
        description="Informação da categoria."
      >
        {categoryDetail && (
          <dl className="grid grid-cols-[auto_1fr] gap-3 text-sm">
            <dt className="text-muted-foreground">Identificador</dt>
            <dd className="break-all">{categoryDetail.id}</dd>
            <dt>Estado</dt>
            <dd>{categoryDetail.isActive ? 'Activa' : 'Inactiva'}</dd>
            <dt>Ordem</dt>
            <dd>{categoryDetail.sortOrder}</dd>
            <dt>Criada</dt>
            <dd>
              {new Date(categoryDetail.createdAt).toLocaleString('pt-AO')}
            </dd>
            <dt>Actualizada</dt>
            <dd>
              {new Date(categoryDetail.updatedAt).toLocaleString('pt-AO')}
            </dd>
          </dl>
        )}
      </CatalogDialog>
      <CatalogDialog
        wide
        open={Boolean(productDetailId)}
        onOpenChange={(open) => {
          if (!open) setProductDetailId(null)
        }}
        title="Detalhes do produto"
        description="Consulta os dados completos e gere as imagens do produto."
      >
        {productDetailId && (
          <ProductDetails
            id={productDetailId}
            categoryName={categoryName}
            canEdit={!options.isPending && !options.isError}
            onEdit={(item) => {
              setProductDetailId(null)
              setProductEdit(item)
            }}
            onDelete={deletedProduct}
          />
        )}
      </CatalogDialog>
    </div>
  )
}
