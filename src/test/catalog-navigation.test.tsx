import { act } from 'react'
import type { ComponentProps } from 'react'
import { expect, it, vi } from 'vitest'
import { CatalogNavigation } from '@/components/menu/catalog-navigation'
import { render } from './utils'
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, ...props }: ComponentProps<'a'> & { to: string }) => (
    <a href={to} {...props} />
  ),
  useLocation: ({
    select,
  }: {
    select: (location: { pathname: string }) => string
  }) => select({ pathname: '/app/menu/products' }),
}))
it('links to separate category and product routes with active state and accessible collapsed icons', async () => {
  const navigate = vi.fn()
  await render(<CatalogNavigation collapsed onNavigate={navigate} />)
  const links = [...document.querySelectorAll('a')]
  expect(links.map((link) => link.getAttribute('href'))).toEqual([
    '/app/menu/categories',
    '/app/menu/products',
  ])
  expect(links[1].getAttribute('aria-current')).toBe('page')
  expect(links[0].getAttribute('aria-label')).toBe('Menu: Categorias')
  expect(links.every((link) => link.querySelector('svg'))).toBe(true)
  await act(async () => {
    links[0].focus()
  })
  expect(document.querySelector('[role=tooltip]')?.textContent).toBe(
    'Abrir categorias do menu',
  )
  await act(async () => {
    links[0].dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    )
  })
  expect(navigate).toHaveBeenCalledTimes(1)
})
