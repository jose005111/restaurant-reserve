import { act } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CatalogManager } from '@/components/menu/menu-manager'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { listAllCategories } from '@/services/menu'
import { menuKeys } from '@/hooks/use-menu'
import type { Category, MenuItem } from '@/types/api'
import { change, render } from './utils'

const category: Category = {
  id: '11111111-1111-4111-8111-111111111111',
  restaurantId: 'tenant',
  name: 'Bebidas',
  isActive: true,
  sortOrder: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
}
const product: MenuItem = {
  id: '22222222-2222-4222-8222-222222222222',
  restaurantId: 'tenant',
  categoryId: category.id,
  name: 'Água',
  description: 'Garrafa de 500 ml',
  priceCents: 50000,
  isAvailable: true,
  sortOrder: 1,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
  images: [
    {
      id: 'image-1',
      menuItemId: 'product',
      url: '/water.webp',
      altText: 'Garrafa de água',
      sortOrder: 0,
      isPrimary: true,
      createdAt: category.createdAt,
    },
    {
      id: 'image-2',
      menuItemId: 'product',
      url: '/water-back.webp',
      altText: 'Rótulo da garrafa',
      sortOrder: 1,
      isPrimary: false,
      createdAt: category.createdAt,
    },
  ],
}
function action(label: string) {
  const target = [
    ...document.querySelectorAll<HTMLButtonElement>('button'),
  ].find((element) => element.getAttribute('aria-label') === label)
  if (!target) throw new Error(`Missing action: ${label}`)
  return target
}
async function clickAction(label: string) {
  await act(async () => {
    action(label).focus()
    action(label).click()
  })
}
async function waitFor(check: () => void) {
  await vi.waitFor(
    async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })
      check()
    },
    { timeout: 2000 },
  )
}
async function show(kind: 'categories' | 'products') {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  await render(
    <QueryClientProvider client={client}>
      <CatalogManager kind={kind} />
    </QueryClientProvider>,
  )
  await waitFor(() =>
    expect(document.querySelector('tbody')?.textContent).toContain(
      kind === 'products' ? 'Água' : 'Bebidas',
    ),
  )
  return client
}
beforeEach(() => {
  vi.restoreAllMocks()
  useAuthStore.setState({
    user: {
      id: 'admin',
      name: 'Admin',
      email: 'admin@example.test',
      role: 'ADMIN',
      restaurantId: 'tenant',
    },
  })
  vi.spyOn(api, 'get').mockImplementation(async (url, config) => {
    const params = (config?.params ?? {}) as { page?: number; limit?: number }
    if (url === '/categories')
      return {
        data: {
          items: [category],
          meta: {
            total: 41,
            page: params.page ?? 1,
            limit: params.limit ?? 20,
            totalPages: params.limit === 100 ? 1 : 3,
          },
        },
      }
    if (url === '/menu-items')
      return {
        data: {
          items: [{ ...product, name: params.page === 2 ? 'Sumo' : 'Água' }],
          meta: {
            total: 41,
            page: params.page ?? 1,
            limit: params.limit ?? 20,
            totalPages: 3,
          },
        },
      }
    if (url === `/menu-items/${product.id}`) return { data: product }
    throw new Error(`Unexpected GET: ${url}`)
  })
})

describe('catalog server pagination', () => {
  it('requests server pages, combines filters and resets the page when filters change', async () => {
    await show('products')
    expect(
      document.querySelector('thead')?.lastElementChild?.lastElementChild
        ?.textContent,
    ).toBe('Acções')
    expect(document.querySelectorAll('img')).toHaveLength(0)
    await clickAction('Página seguinte')
    await waitFor(() =>
      expect(document.querySelector('tbody')?.textContent).toContain('Sumo'),
    )
    expect(api.get).toHaveBeenCalledWith(
      '/menu-items',
      expect.objectContaining({
        params: expect.objectContaining({ page: 2, limit: 20 }),
      }),
    )
    await change('catalog-status', 'false')
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith(
        '/menu-items',
        expect.objectContaining({
          params: expect.objectContaining({ page: 1, isAvailable: false }),
        }),
      ),
    )
    await change('catalog-search', '  Água  ')
    await clickAction('Aplicar pesquisa')
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith(
        '/menu-items',
        expect.objectContaining({
          params: expect.objectContaining({
            page: 1,
            search: 'Água',
            isAvailable: false,
          }),
        }),
      ),
    )
    await clickAction('Limpar filtros')
    expect(
      (document.getElementById('catalog-search') as HTMLInputElement).value,
    ).toBe('')
    expect(menuKeys.items('tenant', { page: 1 })).not.toEqual(
      menuKeys.items('tenant', { page: 2 }),
    )
  })
  it('loads every category page including inactive categories for the selector', async () => {
    vi.mocked(api.get).mockReset()
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          items: [category],
          meta: { page: 1, limit: 100, total: 101, totalPages: 2 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [
            { ...category, id: 'other', name: 'Inactiva', isActive: false },
          ],
          meta: { page: 2, limit: 100, total: 101, totalPages: 2 },
        },
      })
    const result = await listAllCategories()
    expect(result.map((item) => item.name)).toEqual(['Bebidas', 'Inactiva'])
    expect(api.get).toHaveBeenNthCalledWith(2, '/categories', {
      params: { page: 2, limit: 100 },
      signal: undefined,
    })
  })
})

describe('catalog details and actions', () => {
  it('opens all images only in details and replaces details with the edit dialog', async () => {
    await show('products')
    expect(document.querySelectorAll('img')).toHaveLength(0)
    await clickAction('Ver detalhes de Água')
    await waitFor(() =>
      expect(document.querySelectorAll('img')).toHaveLength(2),
    )
    expect(api.get).toHaveBeenCalledWith(`/menu-items/${product.id}`)
    expect(document.querySelector('[role=dialog]')?.textContent).toContain(
      'Garrafa de 500 ml',
    )
    expect(document.querySelector('[role=dialog]')?.textContent).toContain(
      '50000 cêntimos',
    )
    for (const button of document.querySelectorAll('button')) {
      expect(button.getAttribute('aria-label')).toBeTruthy()
      expect(button.querySelector('svg')).not.toBeNull()
    }
    await clickAction('Editar produto')
    await waitFor(() =>
      expect(document.getElementById('item-name')).not.toBeNull(),
    )
    expect(
      document.querySelectorAll('[role=dialog][data-state=open]'),
    ).toHaveLength(1)
    expect(document.querySelectorAll('img')).toHaveLength(0)
    await clickAction('Fechar janela')
    await waitFor(() =>
      expect(document.querySelector('[role=dialog]')).toBeNull(),
    )
    expect(document.activeElement).toBe(action('Ver detalhes de Água'))
  })
  it('supports category create, update and confirmed delete with page reset', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: category })
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: category })
    const remove = vi
      .spyOn(api, 'delete')
      .mockResolvedValue({ data: undefined })
    await show('categories')
    await clickAction('Criar categoria')
    await change('category-name', 'Consumíveis')
    await clickAction('Guardar categoria')
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/categories', {
        name: 'Consumíveis',
        sortOrder: 0,
        isActive: true,
      }),
    )
    await waitFor(() =>
      expect(document.querySelector('[role=dialog]')).toBeNull(),
    )
    await clickAction('Editar Bebidas')
    await change('category-name', 'Bebidas frias')
    await clickAction('Guardar categoria')
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(
        `/categories/${category.id}`,
        expect.objectContaining({ name: 'Bebidas frias' }),
      ),
    )
    await waitFor(() =>
      expect(document.querySelector('[role=dialog]')).toBeNull(),
    )
    await clickAction('Página seguinte')
    await waitFor(() => expect(document.body.textContent).toContain('Página 2'))
    await clickAction('Eliminar Bebidas')
    expect(remove).not.toHaveBeenCalled()
    await clickAction('Confirmar eliminação')
    await waitFor(() =>
      expect(remove).toHaveBeenCalledWith(`/categories/${category.id}`),
    )
    await waitFor(() => expect(document.body.textContent).toContain('Página 1'))
  })
  it('creates, edits and deletes products with the contracted payloads', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: product })
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: product })
    const remove = vi
      .spyOn(api, 'delete')
      .mockResolvedValue({ data: undefined })
    await show('products')
    await clickAction('Criar produto')
    await change('item-name', 'Guardanapos')
    await change('item-price', '9000')
    await clickAction('Guardar produto')
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/menu-items', {
        categoryId: category.id,
        name: 'Guardanapos',
        description: null,
        priceCents: 9000,
        sortOrder: 0,
        isAvailable: true,
      }),
    )
    await waitFor(() =>
      expect(document.querySelector('[role=dialog]')).toBeNull(),
    )
    await clickAction('Editar Água')
    await change('item-name', 'Água fresca')
    await clickAction('Guardar produto')
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(
        `/menu-items/${product.id}`,
        expect.objectContaining({ name: 'Água fresca', priceCents: 50000 }),
      ),
    )
    await waitFor(() =>
      expect(document.querySelector('[role=dialog]')).toBeNull(),
    )
    await clickAction('Eliminar Água')
    await clickAction('Confirmar eliminação')
    await waitFor(() =>
      expect(remove).toHaveBeenCalledWith(`/menu-items/${product.id}`),
    )
  })
  it('manages primary images and uploads explicitly from product details', async () => {
    const patch = vi
      .spyOn(api, 'patch')
      .mockResolvedValue({ data: product.images[1] })
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: product.images[0] })
    await show('products')
    await clickAction('Ver detalhes de Água')
    await waitFor(() =>
      expect(document.querySelectorAll('img')).toHaveLength(2),
    )
    await clickAction('Definir principal')
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(
        `/menu-items/${product.id}/images/image-2`,
        { isPrimary: true },
      ),
    )
    const file = new File(['image'], 'water.png', { type: 'image/png' })
    const input = document.getElementById('new-menu-image')!
    Object.defineProperty(input, 'files', { configurable: true, value: [file] })
    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await change('new-alt', 'Nova fotografia')
    expect(post).not.toHaveBeenCalled()
    await clickAction('Guardar imagem')
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1))
    const [url, form] = post.mock.calls[0]
    expect(url).toBe(`/menu-items/${product.id}/images`)
    expect(form).toBeInstanceOf(FormData)
    expect((form as FormData).get('file')).toBe(file)
    expect((form as FormData).get('altText')).toBe('Nova fotografia')
  })
  it('shows descriptive tooltips on keyboard focus and restores focus after cancelling delete', async () => {
    await show('categories')
    const trigger = action('Eliminar Bebidas')
    await act(async () => {
      trigger.focus()
    })
    await waitFor(() =>
      expect(document.querySelector('[role=tooltip]')?.textContent).toBe(
        'Eliminar Bebidas',
      ),
    )
    await clickAction('Eliminar Bebidas')
    await clickAction('Cancelar eliminação')
    await waitFor(() =>
      expect(document.querySelector('[role=dialog]')).toBeNull(),
    )
    expect(document.activeElement).toBe(trigger)
  })
})
