import { afterEach } from 'vitest'
import { act } from 'react'
import { roots } from './utils'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
afterEach(async () => {
  await act(async () => {
    for (const root of roots) root.unmount()
  })
  roots.length = 0
  document.body.replaceChildren()
})

// jsdom has no layout observer; Radix tooltips use it only for positioning.
Object.assign(globalThis, {
  ResizeObserver: class {
    observe() {
      return undefined
    }
    unobserve() {
      return undefined
    }
    disconnect() {
      return undefined
    }
  },
})
