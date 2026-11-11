import { act } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PublicCartForm } from '@/components/public/public-cart'
import { PublicMenuView } from '@/components/public/public-menu'
import { PublicOrderPage } from '@/components/public/public-order'
import { EMPTY_CART, useCartStore } from '@/stores/cart-store'
import { DEFAULT_BRANDING } from '@/lib/branding'
import * as orders from '@/services/public-orders'
import type { PublicMenu, PublicOrder } from '@/types/api'
import { change, click, render } from './utils'
vi.mock('@/services/public-orders', () => ({
  createPublicOrder: vi.fn(),
  getPublicOrder: vi.fn(),
  cancelPublicOrder: vi.fn(),
}))
const item = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Água',
  description: null,
  priceCents: 50000,
  images: [],
}
const tableId = '22222222-2222-4222-8222-222222222222'
const menu: PublicMenu = {
  linkType: 'TABLE',
  restaurant: {
    name: 'Sabor',
    slug: 'sabor',
    currency: 'AOA',
    phone: null,
    address: null,
  },
  branding: DEFAULT_BRANDING,
  table: { id: tableId, label: 'Mesa 1' },
  tables: [],
  categories: [{ name: 'Bebidas', items: [item] }],
}
const code = 'a'.repeat(32)
const order: PublicOrder = {
  publicCode: code,
  number: 5,
  orderDate: '2026-11-10',
  status: 'PENDING',
  restaurantName: 'Sabor',
  currency: 'AOA',
  tableLabel: 'Mesa 1',
  guestsCount: 2,
  customerNote: 'Sem gelo',
  items: [
    {
      nameSnapshot: 'Água',
      unitPriceCents: 55000,
      quantity: 2,
      note: 'Fresca',
      lineTotalCents: 110000,
    },
  ],
  totalCents: 110000,
  estimatedPrepMinutes: null,
  rejectionReason: null,
  createdAt: '2026-11-10T12:00:00Z',
  acceptedAt: null,
  readyAt: null,
  deliveredAt: null,
  cancelledAt: null,
}
async function mount(content: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  await render(
    <QueryClientProvider client={client}>{content}</QueryClientProvider>,
  )
  return client
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
function action(label: string) {
  const button = document.querySelector<HTMLButtonElement>(
    `button[aria-label="${label}"]`,
  )
  if (!button) throw new Error(`Missing ${label}`)
  return button
}
beforeEach(() => {
  vi.clearAllMocks()
  useCartStore.setState({ carts: {}, inFlight: {} })
  useCartStore.persist.clearStorage()
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
  vi.mocked(orders.createPublicOrder).mockResolvedValue({
    publicCode: code,
    number: 5,
    status: 'PENDING',
    message: 'Pedido enviado',
  })
  vi.mocked(orders.getPublicOrder).mockResolvedValue(order)
  vi.mocked(orders.cancelPublicOrder).mockResolvedValue({
    ...order,
    status: 'CANCELLED',
    cancelledAt: '2026-11-10T12:01:00Z',
  })
})

describe('isolated and persistent public carts', () => {
  it('isolates tokens, merges products and limits quantities without losing notes', () => {
    const store = useCartStore.getState()
    store.add('one', item)
    store.add('one', item)
    store.setNote('one', item.id, 'Fresca')
    store.add('two', { ...item, name: 'Outro menu' })
    expect(useCartStore.getState().carts.one.lines).toEqual([
      { menuItemId: item.id, name: 'Água', quantity: 2, note: 'Fresca' },
    ])
    expect(useCartStore.getState().carts.two.lines[0].quantity).toBe(1)
    store.setQuantity('one', item.id, 100)
    expect(useCartStore.getState().carts.one.lines[0].quantity).toBe(2)
    store.remove('one', item.id)
    expect(useCartStore.getState().carts.two.lines).toHaveLength(1)
  })
  it('persists the immutable request and key across reload and blocks edits during uncertainty', async () => {
    const store = useCartStore.getState()
    store.add('one', item)
    const request = store.prepare('one', menu)
    store.failed('one', request.idempotencyKey, false)
    store.setQuantity('one', item.id, 8)
    const saved = localStorage.getItem('restaurant-reserve.public-carts')!
    useCartStore.setState({ carts: {} })
    localStorage.setItem('restaurant-reserve.public-carts', saved)
    await useCartStore.persist.rehydrate()
    expect(useCartStore.getState().prepare('one', menu)).toEqual(request)
    expect(useCartStore.getState().carts.one.lines[0].quantity).toBe(1)
    expect(request).not.toHaveProperty('tableId')
    expect(request.items[0]).not.toHaveProperty('priceCents')
    expect(request.items[0]).not.toHaveProperty('name')
  })
})

describe('public checkout', () => {
  it('adds from the menu and submits TABLE with quantities, notes and people', async () => {
    const created = vi.fn()
    await mount(
      <PublicMenuView
        token="table-token"
        menu={menu}
        onOrderCreated={created}
      />,
    )
    await act(async () => {
      action('Adicionar Água ao carrinho').click()
    })
    await act(async () => {
      action('Abrir carrinho, 1 produto').click()
    })
    await change(`quantity-${item.id}`, '2')
    await change(`note-${item.id}`, 'Fresca')
    await change('order-guests', '2')
    await change('order-note', 'Sem gelo')
    await click('Confirmar e enviar pedido')
    await waitFor(() => expect(created).toHaveBeenCalledWith(code))
    expect(orders.createPublicOrder).toHaveBeenCalledWith({
      token: 'table-token',
      guestsCount: 2,
      customerNote: 'Sem gelo',
      idempotencyKey: expect.any(String),
      items: [{ menuItemId: item.id, quantity: 2, note: 'Fresca' }],
    })
    expect(useCartStore.getState().carts['table-token'].lines).toEqual([])
    expect(useCartStore.getState().carts['table-token'].lastOrderCode).toBe(
      code,
    )
  })
  it('requires a valid selected table for GENERIC and validates guest limits', async () => {
    const generic: PublicMenu = {
      ...menu,
      linkType: 'GENERIC',
      table: null,
      tables: [{ id: tableId, label: 'Mesa 1' }],
    }
    useCartStore.getState().add('generic', item)
    expect(() => useCartStore.getState().prepare('generic', generic)).toThrow(
      'Escolhe uma mesa',
    )
    await mount(
      <PublicCartForm token="generic" menu={generic} onCreated={vi.fn()} />,
    )
    expect(
      [...document.querySelectorAll('button')].find((button) =>
        button.textContent?.includes('Confirmar e enviar'),
      )?.disabled,
    ).toBe(true)
    await change('order-table', tableId)
    await change('order-guests', '51')
    await click('Confirmar e enviar pedido')
    await waitFor(() =>
      expect(document.body.textContent).toContain('Máximo de 50 pessoas'),
    )
    expect(orders.createPublicOrder).not.toHaveBeenCalled()
    await change('order-guests', '3')
    await click('Confirmar e enviar pedido')
    await waitFor(() =>
      expect(orders.createPublicOrder).toHaveBeenCalledWith(
        expect.objectContaining({ tableId, guestsCount: 3 }),
      ),
    )
  })
  it('allows correction after a definite rejection and uses a new key for each new order', async () => {
    useCartStore.getState().add('correct', item)
    vi.mocked(orders.createPublicOrder).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 400, data: { message: 'Produto indisponível' } },
    })
    await mount(
      <PublicCartForm token="correct" menu={menu} onCreated={vi.fn()} />,
    )
    await click('Confirmar e enviar pedido')
    await waitFor(() => {
      expect(orders.createPublicOrder).toHaveBeenCalledTimes(1)
      expect(useCartStore.getState().carts.correct.pending).toBeNull()
    })
    const firstKey = vi.mocked(orders.createPublicOrder).mock.calls[0][0]
      .idempotencyKey
    await change(`quantity-${item.id}`, '2')
    await click('Confirmar e enviar pedido')
    await waitFor(() =>
      expect(orders.createPublicOrder).toHaveBeenCalledTimes(2),
    )
    const second = vi.mocked(orders.createPublicOrder).mock.calls[1][0]
    expect(second.idempotencyKey).not.toBe(firstKey)
    expect(second.items[0].quantity).toBe(2)
    useCartStore.getState().add('correct', item)
    expect(
      useCartStore.getState().prepare('correct', menu).idempotencyKey,
    ).not.toBe(second.idempotencyKey)
  })
  it('prevents double clicks and retries a failed submission with the same persisted request', async () => {
    useCartStore.getState().add('retry', item)
    let reject!: (error: Error) => void
    vi.mocked(orders.createPublicOrder).mockImplementationOnce(
      () =>
        new Promise((_, failure) => {
          reject = failure
        }),
    )
    await mount(
      <PublicCartForm token="retry" menu={menu} onCreated={vi.fn()} />,
    )
    await act(async () => {
      const send = [...document.querySelectorAll('button')].find((button) =>
        button.textContent?.includes('Confirmar e enviar'),
      )!
      send.click()
      send.click()
    })
    await waitFor(() =>
      expect(orders.createPublicOrder).toHaveBeenCalledTimes(1),
    )
    const first = vi.mocked(orders.createPublicOrder).mock.calls[0][0]
    await act(async () => {
      reject(new Error('Ligação interrompida'))
    })
    await waitFor(() =>
      expect(useCartStore.getState().carts.retry.pending?.uncertain).toBe(true),
    )
    await click('Tentar enviar o mesmo pedido')
    await waitFor(() =>
      expect(orders.createPublicOrder).toHaveBeenCalledTimes(2),
    )
    expect(vi.mocked(orders.createPublicOrder).mock.calls[1][0]).toEqual(first)
    expect(useCartStore.getState().carts.retry).toEqual({
      ...EMPTY_CART,
      lastOrderCode: code,
    })
  })
})

describe('public order tracking', () => {
  it('uses server snapshot prices and updates status manually', async () => {
    vi.mocked(orders.getPublicOrder)
      .mockResolvedValueOnce(order)
      .mockResolvedValue({
        ...order,
        status: 'ACCEPTED',
        estimatedPrepMinutes: 15,
      })
    await mount(<PublicOrderPage publicCode={code} />)
    await waitFor(() =>
      expect(document.body.textContent).toContain('Estado: Pendente'),
    )
    expect(document.body.textContent?.replace(/\s/g, '')).toContain('1100,00')
    expect(document.body.textContent).toContain('Fresca')
    await click('Actualizar estado')
    await waitFor(() =>
      expect(document.body.textContent).toContain('Estado: Aceite'),
    )
    expect(document.body.textContent).toContain('15 minutos')
    expect(document.body.textContent).not.toContain('Cancelar pedido')
  })
  it('cancels only after confirmation and removes the action once cancelled', async () => {
    await mount(<PublicOrderPage publicCode={code} />)
    await waitFor(() =>
      expect(document.body.textContent).toContain('Estado: Pendente'),
    )
    await click('Cancelar pedido')
    expect(orders.cancelPublicOrder).not.toHaveBeenCalled()
    await click('Sim, cancelar pedido')
    await waitFor(() =>
      expect(document.body.textContent).toContain('Estado: Cancelado'),
    )
    expect(orders.cancelPublicOrder).toHaveBeenCalledWith(code)
    expect(document.querySelector('[role=alertdialog]')).toBeNull()
  })
  it('reconciles a cancellation conflict with the current server status', async () => {
    vi.mocked(orders.getPublicOrder)
      .mockResolvedValueOnce(order)
      .mockResolvedValue({ ...order, status: 'ACCEPTED' })
    vi.mocked(orders.cancelPublicOrder).mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { message: 'O pedido já foi aceite' } },
    })
    await mount(<PublicOrderPage publicCode={code} />)
    await waitFor(() =>
      expect(document.body.textContent).toContain('Estado: Pendente'),
    )
    await click('Cancelar pedido')
    await click('Sim, cancelar pedido')
    await waitFor(() =>
      expect(document.body.textContent).toContain('Estado: Aceite'),
    )
    expect(document.body.textContent).not.toContain('Cancelar pedido')
  })
  it('polls active orders and stops polling in a final state', async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(orders.getPublicOrder)
        .mockResolvedValueOnce(order)
        .mockResolvedValue({ ...order, status: 'DELIVERED' })
      await mount(<PublicOrderPage publicCode={code} />)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1)
      })
      expect(orders.getPublicOrder).toHaveBeenCalledTimes(1)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(15000)
      })
      expect(orders.getPublicOrder).toHaveBeenCalledTimes(2)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60000)
      })
      expect(orders.getPublicOrder).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })
})
