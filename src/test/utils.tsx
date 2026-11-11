import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'

export const roots: Root[] = []
export async function render(content: ReactNode) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  roots.push(root)
  await act(async () => root.render(content))
}
export function button(name: string) {
  const found = [...document.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === name,
  )
  if (!found) throw new Error(`Button not found: ${name}`)
  return found
}
export async function click(name: string) {
  await act(async () => button(name).click())
}
export async function change(id: string, value: string) {
  const input = document.getElementById(id) as
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  if (!input) throw new Error(`Field not found: ${id}`)
  const prototype =
    input instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : input instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(
      new Event(input instanceof HTMLSelectElement ? 'change' : 'input', {
        bubbles: true,
      }),
    )
  })
}
