import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CreatePublicOrderInput, PublicMenu } from '@/types/api'
import { publicOrderSchema } from '@/schemas/public-order'
export interface CartLine {
  menuItemId: string
  name: string
  quantity: number
  note: string
}
interface Submission {
  request: CreatePublicOrderInput
  uncertain: boolean
}
export interface PublicCartState {
  lines: CartLine[]
  guestsCount: number
  customerNote: string
  tableId: string
  pending: Submission | null
  lastOrderCode: string | null
}
export const EMPTY_CART: PublicCartState = {
  lines: [],
  guestsCount: 1,
  customerNote: '',
  tableId: '',
  pending: null,
  lastOrderCode: null,
}
interface CartStore {
  carts: Record<string, PublicCartState>
  inFlight: Record<string, boolean>
  add: (token: string, item: { id: string; name: string }) => void
  setQuantity: (token: string, id: string, quantity: number) => void
  setNote: (token: string, id: string, note: string) => void
  remove: (token: string, id: string) => void
  setDetails: (
    token: string,
    details: Partial<
      Pick<PublicCartState, 'guestsCount' | 'customerNote' | 'tableId'>
    >,
  ) => void
  prepare: (token: string, menu: PublicMenu) => CreatePublicOrderInput
  claim: (token: string) => boolean
  release: (token: string) => void
  failed: (token: string, key: string, definiteRejection: boolean) => void
  complete: (token: string, key: string, code: string) => void
}
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => {
      const update = (
        token: string,
        action: (cart: PublicCartState) => PublicCartState,
      ) =>
        set((state) => {
          const cart = state.carts[token] ?? EMPTY_CART
          if (cart.pending) return state
          return { carts: { ...state.carts, [token]: action(cart) } }
        })
      return {
        carts: {},
        inFlight: {},
        add: (token, item) =>
          update(token, (cart) => {
            const current = cart.lines.find(
              (line) => line.menuItemId === item.id,
            )
            if (current)
              return {
                ...cart,
                lines: cart.lines.map((line) =>
                  line.menuItemId === item.id
                    ? { ...line, quantity: Math.min(99, line.quantity + 1) }
                    : line,
                ),
              }
            if (cart.lines.length >= 50) return cart
            return {
              ...cart,
              lines: [
                ...cart.lines,
                { menuItemId: item.id, name: item.name, quantity: 1, note: '' },
              ],
            }
          }),
        setQuantity: (token, id, quantity) =>
          update(token, (cart) =>
            Number.isInteger(quantity) && quantity >= 1 && quantity <= 99
              ? {
                  ...cart,
                  lines: cart.lines.map((line) =>
                    line.menuItemId === id ? { ...line, quantity } : line,
                  ),
                }
              : cart,
          ),
        setNote: (token, id, note) =>
          update(token, (cart) => ({
            ...cart,
            lines: cart.lines.map((line) =>
              line.menuItemId === id
                ? { ...line, note: note.slice(0, 255) }
                : line,
            ),
          })),
        remove: (token, id) =>
          update(token, (cart) => ({
            ...cart,
            lines: cart.lines.filter((line) => line.menuItemId !== id),
          })),
        setDetails: (token, details) =>
          update(token, (cart) => ({ ...cart, ...details })),
        claim: (token) => {
          if (get().inFlight[token]) return false
          set((state) => ({ inFlight: { ...state.inFlight, [token]: true } }))
          return true
        },
        release: (token) =>
          set((state) => ({ inFlight: { ...state.inFlight, [token]: false } })),
        prepare: (token, menu) => {
          const cart = get().carts[token] ?? EMPTY_CART
          if (cart.pending) return cart.pending.request
          if (
            menu.linkType === 'GENERIC' &&
            !menu.tables.some((table) => table.id === cart.tableId)
          )
            throw new Error('Escolhe uma mesa disponível antes de enviar')
          if (menu.linkType === 'TABLE' && !menu.table)
            throw new Error('Não foi possível identificar a mesa')
          const available = new Set(
            menu.categories.flatMap((category) =>
              category.items.map((item) => item.id),
            ),
          )
          if (cart.lines.some((line) => !available.has(line.menuItemId)))
            throw new Error('Remove os produtos indisponíveis antes de enviar')
          const parsed = publicOrderSchema.safeParse({
            token,
            ...(menu.linkType === 'GENERIC' ? { tableId: cart.tableId } : {}),
            guestsCount: cart.guestsCount,
            customerNote: cart.customerNote,
            idempotencyKey: crypto.randomUUID(),
            items: cart.lines.map((line) => ({
              menuItemId: line.menuItemId,
              quantity: line.quantity,
              note: line.note.trim() || null,
            })),
          })
          if (!parsed.success)
            throw new Error(
              parsed.error.issues[0]?.message ?? 'Verifica os dados do pedido',
            )
          const request: CreatePublicOrderInput = parsed.data
          set((state) => ({
            carts: {
              ...state.carts,
              [token]: { ...cart, pending: { request, uncertain: false } },
            },
          }))
          return request
        },
        failed: (token, key, definiteRejection) =>
          set((state) => {
            const cart = state.carts[token]
            if (!cart?.pending || cart.pending.request.idempotencyKey !== key)
              return state
            return {
              carts: {
                ...state.carts,
                [token]: {
                  ...cart,
                  pending:
                    definiteRejection && !cart.pending.uncertain
                      ? null
                      : { ...cart.pending, uncertain: true },
                },
              },
            }
          }),
        complete: (token, key, code) =>
          set((state) => {
            const cart = state.carts[token]
            if (cart?.pending?.request.idempotencyKey !== key) return state
            return {
              carts: {
                ...state.carts,
                [token]: {
                  ...EMPTY_CART,
                  tableId: cart.tableId,
                  lastOrderCode: code,
                },
              },
            }
          }),
      }
    },
    {
      name: 'restaurant-reserve.public-carts',
      partialize: (state) => ({ carts: state.carts }),
    },
  ),
)
