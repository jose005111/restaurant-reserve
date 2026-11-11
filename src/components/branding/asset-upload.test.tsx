import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { click, render } from '@/test/utils'
import { AssetUpload } from './asset-upload'
const { upload, remove } = vi.hoisted(() => ({
  upload: vi.fn(),
  remove: vi.fn(),
}))
vi.mock('@/hooks/use-branding', () => ({
  useUploadBrandingAsset: () => ({ mutateAsync: upload, isPending: false }),
  useRemoveBrandingAsset: () => ({ mutateAsync: remove, isPending: false }),
}))
beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(URL, {
    createObjectURL: vi.fn(() => 'blob:preview'),
    revokeObjectURL: vi.fn(),
  })
})
async function select(file: File) {
  const input = document.querySelector('input[type=file]')!
  Object.defineProperty(input, 'files', { configurable: true, value: [file] })
  await act(async () => {
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
}
describe('branding image persistence', () => {
  it('uploads only after confirmation and never submits its form', async () => {
    const submit = vi.fn((event) => event.preventDefault())
    await render(
      <form onSubmit={submit}>
        <AssetUpload
          asset="banner"
          label="Banner"
          description="Opcional"
          value={null}
        />
      </form>,
    )
    const file = new File(['image'], 'banner.png', { type: 'image/png' })
    await select(file)
    expect(upload).not.toHaveBeenCalled()
    await click('Guardar imagem')
    expect(upload).toHaveBeenCalledWith({ asset: 'banner', file })
    expect(submit).not.toHaveBeenCalled()
    expect(document.body.textContent).not.toContain('Guardar imagem')
  })
  it('allows cancellation and rejects unsupported files', async () => {
    await render(
      <AssetUpload
        asset="logo"
        label="Logo"
        description="Opcional"
        value={null}
      />,
    )
    await select(new File(['data'], 'logo.png', { type: 'image/png' }))
    await click('Cancelar selecção')
    expect(document.body.textContent).not.toContain('Guardar imagem')
    await select(new File(['data'], 'bad.svg', { type: 'image/svg+xml' }))
    expect(document.body.textContent).not.toContain('Guardar imagem')
    expect(upload).not.toHaveBeenCalled()
  })
})
