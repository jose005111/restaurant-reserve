import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DEFAULT_BRANDING } from '@/lib/branding'
import { canManageMenu, filterMenuItems } from '@/lib/menu'
import { PublicMenuView } from '@/components/public/public-menu'
import { menuKeys, useAvailability } from '@/hooks/use-menu'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import type { MenuItem, PublicMenu } from '@/types/api'
import { useThemeStore } from '@/stores/theme-store'
import { change, click, render, roots } from './utils'

const dish = {
  id: 'dish-1',
  name: 'Calulu',
  description: 'Peixe fresco',
  priceCents: 250000,
  images: [],
}
const publicMenu: PublicMenu = {
  linkType: 'TABLE',
  restaurant: {
    name: 'Sabor',
    slug: 'sabor',
    currency: 'AOA',
    phone: null,
    address: null,
  },
  branding: {
    ...DEFAULT_BRANDING,
    themeMode: 'DARK',
    faviconUrl: '/sabor-icon.png',
  },
  table: { id: 'table-1', label: 'Mesa 3' },
  tables: [],
  categories: [{ name: 'Pratos', items: [dish] }],
}
beforeEach(() => {
  vi.restoreAllMocks()
  useThemeStore.setState({ theme: 'light' })
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
})
describe('public menu', () => {
  it('renders fixed table, prices and applies branding with cleanup', async () => {
    const title = document.title
    const originalIcon = document
      .querySelector<HTMLLinkElement>('link[rel="icon"]')
      ?.getAttribute('href')
    await render(<PublicMenuView token="menu-test" menu={publicMenu} />)
    expect(document.body.textContent).toContain('Mesa: Mesa 3')
    expect(document.body.textContent).toContain('Calulu')
    expect(document.body.textContent?.replace(/\s/g, '')).toContain('2500,00')
    expect(document.getElementById('public-table')).toBeNull()
    expect(document.title).toBe('Sabor')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(
      document
        .querySelector<HTMLLinkElement>('link[rel="icon"]')
        ?.getAttribute('href'),
    ).toBe('/sabor-icon.png')
    await act(async () => roots.pop()!.unmount())
    expect(document.title).toBe(title)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(
      document
        .querySelector<HTMLLinkElement>('link[rel="icon"]')
        ?.getAttribute('href'),
    ).toBe(originalIcon)
  })
  it('allows generic table selection and filters dishes without creating orders', async () => {
    await render(
      <PublicMenuView
        token="menu-test"
        menu={{
          ...publicMenu,
          linkType: 'GENERIC',
          table: null,
          tables: [{ id: 'table-2', label: 'Mesa 4' }],
        }}
      />,
    )
    await change('public-table', 'table-2')
    expect(
      (document.getElementById('public-table') as HTMLSelectElement).value,
    ).toBe('table-2')
    await change('public-search', 'sobremesa')
    expect(document.body.textContent).not.toContain('Calulu')
    expect(document.body.textContent).toContain('Nenhum prato corresponde')
    await change('public-search', 'PEIXE')
    expect(document.body.textContent).toContain('Calulu')
  })
  it('shows empty menu and absence of active tables', async () => {
    await render(
      <PublicMenuView
        token="menu-test"
        menu={{
          ...publicMenu,
          categories: [],
          linkType: 'GENERIC',
          table: null,
        }}
      />,
    )
    expect(document.body.textContent).toContain('Não há mesas disponíveis')
    expect(document.body.textContent).toContain(
      'O menu ainda não tem pratos disponíveis',
    )
  })
})
describe('staff menu', () => {
  it('allows management only to ADMIN and isolates query keys', () => {
    expect(canManageMenu('ADMIN')).toBe(true)
    for (const role of ['COUNTER', 'SUPER_ADMIN', undefined] as const)
      expect(canManageMenu(role)).toBe(false)
    expect(menuKeys.items('tenant-a')).not.toEqual(menuKeys.items('tenant-b'))
    expect(menuKeys.public('token-a')).not.toEqual(menuKeys.public('token-b'))
  })
  it('combines category and name filters', () => {
    const base: MenuItem = {
      ...dish,
      categoryId: 'fish',
      restaurantId: 'tenant',
      isAvailable: true,
      sortOrder: 0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }
    const items = [
      base,
      { ...base, id: 'other', name: 'Arroz', categoryId: 'sides' },
    ]
    expect(
      filterMenuItems(items, ' CALU ', 'fish').map((item) => item.id),
    ).toEqual(['dish-1'])
    expect(filterMenuItems(items, 'calu', 'sides')).toEqual([])
  })
  it('changes availability with the contracted payload and invalidates menu data', async () => {
    const patch = vi
      .spyOn(api, 'patch')
      .mockResolvedValue({ data: { ...dish, isAvailable: false } })
    useAuthStore.setState({
      user: {
        id: 'user',
        restaurantId: 'tenant',
        role: 'COUNTER',
        name: 'Balcão',
        email: 'staff@example.test',
      },
    })
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    function Toggle() {
      const mutation = useAvailability()
      return (
        <button
          onClick={() => mutation.mutate({ id: 'dish-1', isAvailable: false })}
        >
          Indisponível
        </button>
      )
    }
    await render(
      <QueryClientProvider client={client}>
        <Toggle />
      </QueryClientProvider>,
    )
    await click('Indisponível')
    expect(patch).toHaveBeenCalledWith('/menu-items/dish-1/availability', {
      isAvailable: false,
    })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: menuKeys.staff('tenant'),
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['menu', 'public'] })
  })
})
