import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Field } from '@/components/forms/field'
import { Save, Power, FolderOpen } from 'lucide-react'
import { CatalogAction } from './catalog-action'
import { CatalogFilter } from './catalog-filter'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { categorySchema, menuItemSchema } from '@/schemas/menu'
import type { CategoryFormValues, MenuItemFormValues } from '@/schemas/menu'
import type { Category, MenuItem } from '@/types/api'
import {
  useCreateCategory,
  useUpdateCategory,
  useCreateMenuItem,
  useUpdateMenuItem,
} from '@/hooks/use-menu'

export function CategoryForm({
  category,
  onDone,
}: {
  category?: Category
  onDone: () => void
}) {
  const create = useCreateCategory(),
    update = useUpdateCategory()
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? '',
      sortOrder: category?.sortOrder ?? 0,
      isActive: category?.isActive ?? true,
    },
  })
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={form.handleSubmit(async (input) => {
        try {
          if (category) await update.mutateAsync({ id: category.id, input })
          else await create.mutateAsync(input)
          onDone()
        } catch {
          /* Mutation reports the API error. */
        }
      })}
    >
      <Field
        label="Nome da categoria"
        htmlFor="category-name"
        error={form.formState.errors.name?.message}
      >
        <Input id="category-name" {...form.register('name')} />
      </Field>
      <Field
        label="Ordem"
        htmlFor="category-order"
        error={form.formState.errors.sortOrder?.message}
      >
        <Input
          id="category-order"
          type="number"
          min={0}
          {...form.register('sortOrder', { valueAsNumber: true })}
        />
      </Field>
      <CatalogFilter
        icon={Power}
        label="Categoria activa"
        tooltip="Mostrar esta categoria no menu público"
      >
        <input
          className="size-5"
          type="checkbox"
          {...form.register('isActive')}
        />
      </CatalogFilter>
      <CatalogAction
        icon={Save}
        label="Guardar categoria"
        type="submit"
        disabled={create.isPending || update.isPending}
      />
    </form>
  )
}

export function MenuItemForm({
  item,
  categories,
  onDone,
}: {
  item?: MenuItem
  categories: Category[]
  onDone: () => void
}) {
  const create = useCreateMenuItem(),
    update = useUpdateMenuItem()
  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      categoryId: item?.categoryId ?? categories[0]?.id ?? '',
      name: item?.name ?? '',
      description: item?.description ?? '',
      priceCents: item?.priceCents ?? 0,
      sortOrder: item?.sortOrder ?? 0,
      isAvailable: item?.isAvailable ?? true,
    },
  })
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        const input = { ...values, description: values.description || null }
        try {
          if (item) await update.mutateAsync({ id: item.id, input })
          else await create.mutateAsync(input)
          onDone()
        } catch {
          /* Mutation reports the API error. */
        }
      })}
    >
      <CatalogFilter
        icon={FolderOpen}
        label="Categoria"
        tooltip="Escolher a categoria do produto, incluindo categorias inactivas"
      >
        <select
          id="item-category"
          className="h-11 w-full rounded-md border bg-background px-3"
          aria-invalid={Boolean(form.formState.errors.categoryId)}
          {...form.register('categoryId')}
        >
          <option value="">Escolhe uma categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
              {category.isActive ? '' : ' (inactiva)'}
            </option>
          ))}
        </select>
      </CatalogFilter>
      {form.formState.errors.categoryId && (
        <p className="text-sm text-destructive">
          {form.formState.errors.categoryId.message}
        </p>
      )}
      <Field
        label="Nome do produto"
        htmlFor="item-name"
        error={form.formState.errors.name?.message}
      >
        <Input id="item-name" {...form.register('name')} />
      </Field>
      <Field
        label="Descrição"
        htmlFor="item-description"
        error={form.formState.errors.description?.message}
      >
        <Textarea id="item-description" {...form.register('description')} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Preço em cêntimos"
          htmlFor="item-price"
          hint="Exemplo: 150000 corresponde a 1500,00 na moeda do restaurante."
          error={form.formState.errors.priceCents?.message}
        >
          <Input
            id="item-price"
            type="number"
            min={0}
            step={1}
            {...form.register('priceCents', { valueAsNumber: true })}
          />
        </Field>
        <Field
          label="Ordem"
          htmlFor="item-order"
          error={form.formState.errors.sortOrder?.message}
        >
          <Input
            id="item-order"
            type="number"
            min={0}
            {...form.register('sortOrder', { valueAsNumber: true })}
          />
        </Field>
      </div>
      <CatalogFilter
        icon={Power}
        label="Produto disponível"
        tooltip="Mostrar este produto como disponível"
      >
        <input
          className="size-5"
          type="checkbox"
          {...form.register('isAvailable')}
        />
      </CatalogFilter>
      <CatalogAction
        icon={Save}
        label="Guardar produto"
        type="submit"
        disabled={create.isPending || update.isPending}
      />
    </form>
  )
}
