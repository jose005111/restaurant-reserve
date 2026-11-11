import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Minus,
  Plus,
  ShoppingCart,
  Send,
  Trash2,
  X,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/forms/field'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { useCartStore, EMPTY_CART } from '@/stores/cart-store'
import { useSubmitPublicOrder } from '@/hooks/use-public-orders'
import { orderDetailsSchema } from '@/schemas/public-order'
import type { OrderDetailsValues } from '@/schemas/public-order'
import type { PublicMenu } from '@/types/api'

export function PublicCart({
  token,
  menu,
  onCreated,
}: {
  token: string
  menu: PublicMenu
  onCreated?: (code: string) => Promise<void> | void
}) {
  const cart = useCartStore((state) => state.carts[token] ?? EMPTY_CART)
  const count = cart.lines.reduce((sum, line) => sum + line.quantity, 0)
  return (
    <Sheet>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
          {cart.lastOrderCode && (
            <a
              className="flex min-h-11 items-center gap-2 text-sm text-primary underline"
              href={`/orders/${encodeURIComponent(cart.lastOrderCode)}`}
            >
              <ExternalLink className="size-4" />
              Acompanhar último pedido
            </a>
          )}
          <SheetTrigger asChild>
            <Button
              className="min-h-11 flex-1"
              aria-label={`Abrir carrinho, ${count} ${count === 1 ? 'produto' : 'produtos'}`}
            >
              <ShoppingCart className="size-5" />
              Ver pedido ({count})
            </Button>
          </SheetTrigger>
        </div>
      </div>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-h-[90dvh] max-w-3xl overflow-y-auto rounded-t-xl"
      >
        <SheetHeader className="pr-14">
          <SheetTitle>O teu pedido</SheetTitle>
          <SheetDescription>
            Revê os produtos e os dados da mesa antes de enviar.
          </SheetDescription>
        </SheetHeader>
        <SheetClose asChild>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Fechar carrinho"
            className="absolute right-4 top-4"
          >
            <X />
          </Button>
        </SheetClose>
        <PublicCartForm token={token} menu={menu} onCreated={onCreated} />
      </SheetContent>
    </Sheet>
  )
}

export function PublicCartForm({
  token,
  menu,
  onCreated,
}: {
  token: string
  menu: PublicMenu
  onCreated?: (code: string) => Promise<void> | void
}) {
  const cart = useCartStore((state) => state.carts[token] ?? EMPTY_CART)
  const { setQuantity, setNote, remove, setDetails } = useCartStore()
  const submission = useSubmitPublicOrder(token)
  const locked = Boolean(cart.pending) || submission.isPending
  const products = new Map(
    menu.categories.flatMap((category) =>
      category.items.map((item) => [item.id, item] as const),
    ),
  )
  const unavailable = cart.lines.some((line) => !products.has(line.menuItemId))
  const total = cart.lines.reduce(
    (sum, line) =>
      sum + (products.get(line.menuItemId)?.priceCents ?? 0) * line.quantity,
    0,
  )
  const money = new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: menu.restaurant.currency,
  })
  const validTable =
    menu.linkType === 'TABLE'
      ? Boolean(menu.table)
      : menu.tables.some((table) => table.id === cart.tableId)
  const form = useForm<OrderDetailsValues>({
    resolver: zodResolver(orderDetailsSchema),
    defaultValues: {
      guestsCount: cart.guestsCount,
      customerNote: cart.customerNote,
    },
  })
  return (
    <form
      className="space-y-5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        const send = async () => {
          const result = await submission.submit(menu)
          if (result) {
            try {
              if (onCreated) await onCreated(result.publicCode)
              else
                window.location.assign(
                  `/orders/${encodeURIComponent(result.publicCode)}`,
                )
            } catch {
              toast.error(
                'Pedido enviado. Usa a ligação «Acompanhar último pedido» para continuar.',
              )
            }
          }
        }
        if (cart.pending) {
          void send()
          return
        }
        void form.handleSubmit(async (values) => {
          setDetails(token, values)
          await send()
        })(event)
      }}
    >
      {cart.pending && (
        <div
          role="alert"
          className="space-y-2 rounded-lg border bg-muted p-3 text-sm"
        >
          <p>
            Existe uma submissão por confirmar. Repete o envio do mesmo pedido;
            não será criado um duplicado.
          </p>
          <p>
            Os dados estão bloqueados até a resposta do servidor. Se o QR code
            deixou de funcionar, confirma com a equipa antes de criar outro
            pedido.
          </p>
        </div>
      )}
      {cart.lines.length === 0 && (
        <p className="py-6 text-center text-muted-foreground">
          O carrinho está vazio. Adiciona produtos do menu.
        </p>
      )}
      <ul className="space-y-4">
        {cart.lines.map((line) => {
          const item = products.get(line.menuItemId)
          return (
            <li
              key={line.menuItemId}
              className="space-y-3 rounded-lg border p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{item?.name ?? line.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item
                      ? money.format((item.priceCents * line.quantity) / 100)
                      : 'Produto indisponível — remove-o para continuar'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label={`Remover ${line.name}`}
                  disabled={locked}
                  onClick={() => remove(token, line.menuItemId)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="size-11"
                  aria-label={`Diminuir quantidade de ${line.name}`}
                  disabled={locked || line.quantity <= 1}
                  onClick={() =>
                    setQuantity(token, line.menuItemId, line.quantity - 1)
                  }
                >
                  <Minus />
                </Button>
                <label
                  className="sr-only"
                  htmlFor={`quantity-${line.menuItemId}`}
                >
                  Quantidade de {line.name}
                </label>
                <Input
                  id={`quantity-${line.menuItemId}`}
                  type="number"
                  min={1}
                  max={99}
                  className="h-11 w-20 text-center"
                  value={line.quantity}
                  disabled={locked}
                  onChange={(event) =>
                    setQuantity(
                      token,
                      line.menuItemId,
                      Number(event.target.value),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  className="size-11"
                  aria-label={`Aumentar quantidade de ${line.name}`}
                  disabled={locked || line.quantity >= 99}
                  onClick={() =>
                    setQuantity(token, line.menuItemId, line.quantity + 1)
                  }
                >
                  <Plus />
                </Button>
              </div>
              <Field
                label={`Nota para ${line.name}`}
                htmlFor={`note-${line.menuItemId}`}
                hint="Opcional. Máximo de 255 caracteres."
              >
                <Textarea
                  id={`note-${line.menuItemId}`}
                  maxLength={255}
                  disabled={locked}
                  value={line.note}
                  onChange={(event) =>
                    setNote(token, line.menuItemId, event.target.value)
                  }
                />
              </Field>
            </li>
          )
        })}
      </ul>
      {menu.linkType === 'TABLE' ? (
        <p className="rounded-lg bg-muted p-3 text-sm">
          Mesa: {menu.table?.label ?? 'Mesa não identificada'}
        </p>
      ) : (
        <Field
          label="Mesa do pedido"
          htmlFor="order-table"
          hint="Obrigatório escolher uma mesa activa."
        >
          <select
            id="order-table"
            className="h-11 w-full rounded-md border bg-background px-3"
            value={cart.tableId}
            disabled={locked}
            onChange={(event) =>
              setDetails(token, { tableId: event.target.value })
            }
          >
            <option value="">Selecciona uma mesa</option>
            {menu.tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.label}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field
        label="Número de pessoas"
        htmlFor="order-guests"
        error={form.formState.errors.guestsCount?.message}
      >
        <Input
          id="order-guests"
          type="number"
          min={1}
          max={50}
          disabled={locked}
          {...form.register('guestsCount', {
            valueAsNumber: true,
            onChange: (event) =>
              setDetails(token, {
                guestsCount: Number(event.target.value) || 1,
              }),
          })}
        />
      </Field>
      <Field
        label="Nota geral do pedido"
        htmlFor="order-note"
        hint="Opcional. Máximo de 500 caracteres."
        error={form.formState.errors.customerNote?.message}
      >
        <Textarea
          id="order-note"
          maxLength={500}
          disabled={locked}
          {...form.register('customerNote', {
            onChange: (event) =>
              setDetails(token, { customerNote: event.target.value }),
          })}
        />
      </Field>
      <div className="space-y-2 rounded-lg bg-muted p-4">
        <p className="flex justify-between gap-3 font-semibold">
          <span>Total estimado</span>
          <span>{money.format(total / 100)}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          O servidor confirma os preços e a disponibilidade ao receber o pedido.
          O total final aparece no acompanhamento.
        </p>
      </div>
      {!cart.pending && !validTable && (
        <p role="alert" className="text-sm text-destructive">
          Escolhe uma mesa disponível antes de enviar.
        </p>
      )}
      {!cart.pending && total > 2147483647 && (
        <p role="alert" className="text-sm text-destructive">
          O total excede o limite do pedido. Reduz as quantidades.
        </p>
      )}
      {!cart.pending && unavailable && (
        <p role="alert" className="text-sm text-destructive">
          Há produtos indisponíveis no carrinho.
        </p>
      )}
      <Button
        type="submit"
        className="min-h-11 w-full"
        disabled={
          submission.isPending ||
          (!cart.pending &&
            (cart.lines.length === 0 ||
              !validTable ||
              unavailable ||
              total > 2147483647))
        }
      >
        <Send className="size-4" />
        {submission.isPending
          ? 'A enviar...'
          : cart.pending
            ? 'Tentar enviar o mesmo pedido'
            : 'Confirmar e enviar pedido'}
      </Button>
      {cart.lastOrderCode && (
        <a
          href={`/orders/${encodeURIComponent(cart.lastOrderCode)}`}
          className="block py-2 text-center text-primary underline"
        >
          Acompanhar último pedido
        </a>
      )}
    </form>
  )
}
