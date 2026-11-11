import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { PublicCart } from './public-cart'
import { EMPTY_CART, useCartStore } from '@/stores/cart-store'
import { applyBranding, resetBranding } from '@/lib/branding'
import { applyTheme, useThemeStore } from '@/stores/theme-store'
import { usePublicMenu } from '@/hooks/use-menu'
import type { PublicMenu } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function PublicMenuPage({ token }: { token: string }) {
  const navigate = useNavigate()
  const query = usePublicMenu(token)
  if (query.isPending)
    return (
      <main
        className="mx-auto min-h-dvh max-w-3xl space-y-4 p-4"
        role="status"
        aria-label="A carregar menu"
      >
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </main>
    )
  if (query.isError || !query.data)
    return (
      <main
        className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 p-6"
        role="alert"
      >
        <h1 className="text-xl font-semibold">Não foi possível abrir o menu</h1>
        <p className="text-muted-foreground">
          O link pode ter expirado ou o restaurante pode estar indisponível.
          Confirma o QR code com a equipa.
        </p>
        <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
      </main>
    )
  return (
    <PublicMenuView
      key={token}
      token={token}
      menu={query.data}
      onOrderCreated={(code) =>
        navigate({ to: '/orders/$publicCode', params: { publicCode: code } })
      }
    />
  )
}

function usePublicBranding(menu: PublicMenu) {
  useEffect(() => {
    const oldTitle = document.title
    const originalStyles = document.documentElement.getAttribute('style')
    const previousIcon =
      document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    const oldHref = previousIcon?.getAttribute('href')
    const icon = previousIcon ?? document.createElement('link')
    if (!previousIcon) {
      icon.rel = 'icon'
      document.head.append(icon)
    }
    applyBranding(menu.branding)
    applyTheme(
      menu.branding.themeMode === 'DARK'
        ? 'dark'
        : menu.branding.themeMode === 'LIGHT'
          ? 'light'
          : 'system',
    )
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    const updateSystem = () => {
      if (menu.branding.themeMode === 'SYSTEM') applyTheme('system')
    }
    media?.addEventListener('change', updateSystem)
    document.title = menu.restaurant.name
    if (menu.branding.faviconUrl) icon.href = menu.branding.faviconUrl
    return () => {
      media?.removeEventListener('change', updateSystem)
      document.title = oldTitle
      if (previousIcon) {
        if (oldHref === null || oldHref === undefined)
          icon.removeAttribute('href')
        else icon.setAttribute('href', oldHref)
      } else icon.remove()
      resetBranding()
      if (originalStyles === null)
        document.documentElement.removeAttribute('style')
      else document.documentElement.setAttribute('style', originalStyles)
      applyTheme(useThemeStore.getState().theme)
    }
  }, [menu])
}
export function PublicMenuView({
  menu,
  token,
  onOrderCreated,
}: {
  menu: PublicMenu
  token: string
  onOrderCreated?: (code: string) => Promise<void> | void
}) {
  usePublicBranding(menu)
  const cart = useCartStore((state) => state.carts[token] ?? EMPTY_CART)
  const add = useCartStore((state) => state.add)
  const setDetails = useCartStore((state) => state.setDetails)
  const submitting = useCartStore((state) => Boolean(state.inFlight[token]))
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const categories = menu.categories
    .filter((current) => !category || current.name === category)
    .map((current) => ({
      ...current,
      items: current.items.filter((item) =>
        `${item.name} ${item.description ?? ''}`
          .toLocaleLowerCase('pt')
          .includes(search.trim().toLocaleLowerCase('pt')),
      ),
    }))
    .filter((current) => current.items.length > 0)
  const currency = new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: menu.restaurant.currency,
  })
  return (
    <main className="mx-auto min-h-dvh max-w-4xl bg-background pb-32 text-foreground">
      <header className="space-y-4 p-4 sm:p-6">
        {menu.branding.bannerUrl && (
          <img
            src={menu.branding.bannerUrl}
            alt={`Menu de ${menu.restaurant.name}`}
            className="aspect-[3/1] w-full rounded-lg object-cover"
          />
        )}
        <div className="flex items-center gap-3">
          {(menu.branding.logoUrl || menu.branding.logoDarkUrl) && (
            <>
              <img
                src={menu.branding.logoUrl ?? menu.branding.logoDarkUrl!}
                alt={`Logótipo de ${menu.restaurant.name}`}
                className="size-16 rounded-lg object-contain dark:hidden"
              />
              <img
                src={menu.branding.logoDarkUrl ?? menu.branding.logoUrl!}
                alt={`Logótipo de ${menu.restaurant.name}`}
                className="hidden size-16 rounded-lg object-contain dark:block"
              />
            </>
          )}
          <div>
            <h1 className="text-2xl font-semibold">{menu.restaurant.name}</h1>
            {menu.branding.welcomeTitle && (
              <p className="font-medium">{menu.branding.welcomeTitle}</p>
            )}
          </div>
        </div>
        {menu.branding.welcomeMessage && (
          <p className="text-sm text-muted-foreground">
            {menu.branding.welcomeMessage}
          </p>
        )}
        {menu.linkType === 'TABLE' ? (
          <p className="rounded-lg bg-muted p-3 text-sm font-medium">
            Mesa: {menu.table?.label ?? 'Confirma a mesa com a equipa'}
          </p>
        ) : (
          <div className="space-y-2 rounded-lg border p-3">
            <label htmlFor="public-table" className="block text-sm font-medium">
              Escolhe a tua mesa
            </label>
            <select
              id="public-table"
              className="h-11 w-full rounded-md border bg-background px-3"
              value={cart.tableId}
              disabled={Boolean(cart.pending) || submitting}
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
            <p className="text-xs text-muted-foreground">
              {menu.tables.length
                ? 'Escolhe a mesa para onde devemos levar o teu pedido.'
                : 'Não há mesas disponíveis. Contacta a equipa.'}
            </p>
          </div>
        )}
      </header>
      <div className="sticky top-0 z-10 space-y-3 border-y bg-background p-4 sm:px-6">
        <label className="block text-sm">
          Pesquisar no menu
          <input
            id="public-search"
            className="mt-1 h-11 w-full rounded-md border bg-background px-3"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="block text-sm">
          Categoria
          <select
            id="public-category"
            className="ml-2 h-11 max-w-full rounded-md border bg-background px-3"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">Todas</option>
            {menu.categories.map((current, index) => (
              <option key={`${current.name}-${index}`} value={current.name}>
                {current.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="space-y-8 p-4 sm:p-6">
        {categories.length === 0 && (
          <p className="rounded-lg border p-6 text-center text-muted-foreground">
            {menu.categories.length
              ? 'Nenhum prato corresponde à pesquisa.'
              : 'O menu ainda não tem pratos disponíveis. Contacta a equipa.'}
          </p>
        )}
        {categories.map((current, index) => (
          <section key={`${current.name}-${index}`} className="space-y-3">
            <h2 className="text-xl font-semibold">{current.name}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {current.items.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-lg border bg-card text-card-foreground"
                >
                  {item.images.length > 0 && (
                    <div className="flex snap-x overflow-x-auto">
                      {[...item.images]
                        .sort(
                          (a, b) =>
                            Number(b.isPrimary) - Number(a.isPrimary) ||
                            a.sortOrder - b.sortOrder,
                        )
                        .map((image, imageIndex) => (
                          <img
                            key={`${image.url}-${imageIndex}`}
                            src={image.url}
                            alt={image.altText ?? item.name}
                            loading="lazy"
                            className="aspect-[4/3] w-full shrink-0 snap-center object-cover"
                          />
                        ))}
                    </div>
                  )}
                  <div className="space-y-2 p-4">
                    <h3 className="font-semibold">{item.name}</h3>
                    {item.description && (
                      <p className="whitespace-pre-line text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                    <p className="font-semibold text-primary">
                      {currency.format(item.priceCents / 100)}
                    </p>
                    <Button
                      type="button"
                      className="min-h-11 w-full"
                      aria-label={`Adicionar ${item.name} ao carrinho`}
                      disabled={
                        Boolean(cart.pending) ||
                        submitting ||
                        (cart.lines.find((line) => line.menuItemId === item.id)
                          ?.quantity ?? 0) >= 99 ||
                        (cart.lines.length >= 50 &&
                          !cart.lines.some(
                            (line) => line.menuItemId === item.id,
                          ))
                      }
                      onClick={() => add(token, item)}
                    >
                      <Plus className="size-4" />
                      Adicionar
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <footer className="space-y-3 border-t p-4 text-sm text-muted-foreground sm:p-6">
        {menu.restaurant.address && <p>{menu.restaurant.address}</p>}
        {menu.restaurant.phone && <p>Telefone: {menu.restaurant.phone}</p>}
        {menu.branding.whatsapp && <p>WhatsApp: {menu.branding.whatsapp}</p>}
        <div className="flex flex-wrap gap-4">
          {(
            [
              ['Instagram', menu.branding.instagramUrl],
              ['Facebook', menu.branding.facebookUrl],
              ['Website', menu.branding.websiteUrl],
            ] as const
          )
            .filter(([, url]) => url && /^https:\/\//i.test(url))
            .map(([label, url]) => (
              <a
                key={label}
                href={url!}
                target="_blank"
                rel="noopener noreferrer"
                className="underline focus-visible:outline focus-visible:outline-ring"
              >
                {label}
              </a>
            ))}
        </div>
        {menu.branding.footerText && <p>{menu.branding.footerText}</p>}
      </footer>
      <PublicCart token={token} menu={menu} onCreated={onOrderCreated} />
    </main>
  )
}
