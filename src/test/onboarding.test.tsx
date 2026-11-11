import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_BRANDING } from '@/lib/branding'
import { OnboardingWizard } from '@/routes/app/onboarding'
import { change, click, render } from './utils'

const { update, navigate } = vi.hoisted(() => ({
  update: vi.fn(),
  navigate: vi.fn(),
}))
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({}),
  useNavigate: () => navigate,
}))
vi.mock('@/hooks/use-branding', () => ({
  useBranding: vi.fn(),
  useUpdateBranding: () => ({ mutateAsync: update, isPending: false }),
}))
vi.mock('@/components/branding/asset-upload', () => ({
  AssetUpload: ({ label }: { label: string }) => <div>{label}</div>,
}))
const branding = {
  ...DEFAULT_BRANDING,
  welcomeTitle: 'Restaurante',
  logoUrl: '/logo.png',
}
async function openContacts() {
  await click('Continuar')
  await click('Continuar')
}
beforeEach(() => {
  vi.clearAllMocks()
  update.mockResolvedValue(branding)
})

describe('onboarding contacts', () => {
  it('requires explicit finish after navigation, editing and Enter', async () => {
    await render(<OnboardingWizard branding={branding} />)
    await openContacts()
    expect(update).not.toHaveBeenCalled()
    await change('whatsapp', '+244 923 000 000')
    await act(async () => {
      document.getElementById('whatsapp')!.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        }),
      )
      document
        .querySelector('form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    expect(update).not.toHaveBeenCalled()
    await click('Concluir e entrar no painel')
    expect(update).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        whatsapp: '+244 923 000 000',
        instagramUrl: null,
        fontFamily: null,
      }),
    )
    expect(navigate).toHaveBeenCalledWith({ to: '/app' })
  })
  it('keeps invalid contacts without saving or navigating', async () => {
    await render(<OnboardingWizard branding={branding} />)
    await openContacts()
    await change('websiteUrl', 'http://invalid.example')
    await click('Concluir e entrar no painel')
    expect(document.body.textContent).toContain(
      'Use uma URL que comece por https://',
    )
    expect(update).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })
  it('exposes optional assets and saves selected font', async () => {
    await render(<OnboardingWizard branding={branding} />)
    for (const label of [
      'Logótipo para tema escuro (opcional)',
      'Ícone do site (opcional)',
      'Imagem de entrada (opcional)',
      'Banner do menu (opcional)',
    ])
      expect(document.body.textContent).toContain(label)
    await click('Continuar')
    await change('fontFamily', 'Poppins')
    await click('Continuar')
    await click('Concluir e entrar no painel')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ fontFamily: 'Poppins' }),
    )
  })
})
