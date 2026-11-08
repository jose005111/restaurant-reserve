import type { Branding } from '@/types/api'

export const DEFAULT_BRANDING: Branding = {
  logoUrl: null,
  logoDarkUrl: null,
  faviconUrl: null,
  bannerUrl: null,
  loginImageUrl: null,
  primaryColor: '#111827',
  secondaryColor: '#6B7280',
  accentColor: '#F59E0B',
  backgroundColor: '#FFFFFF',
  surfaceColor: '#F9FAFB',
  textColor: '#111827',
  themeMode: 'LIGHT',
  fontFamily: null,
  borderRadius: 12,
  welcomeTitle: null,
  welcomeMessage: null,
  footerText: null,
  instagramUrl: null,
  facebookUrl: null,
  websiteUrl: null,
  whatsapp: null,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
}

function readableOn(hex: string): string {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized, 16)

  if (Number.isNaN(value)) {
    return '#FFFFFF'
  }

  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  const luminance = (r * 299 + g * 587 + b * 114) / 1000

  return luminance > 150 ? '#111827' : '#FFFFFF'
}

export function applyBranding(branding: Branding): void {
  const style = document.documentElement.style

  style.setProperty('--background', branding.backgroundColor)
  style.setProperty('--foreground', branding.textColor)
  style.setProperty('--card', branding.surfaceColor)
  style.setProperty('--card-foreground', branding.textColor)
  style.setProperty('--popover', branding.surfaceColor)
  style.setProperty('--popover-foreground', branding.textColor)
  style.setProperty('--primary', branding.primaryColor)
  style.setProperty('--primary-foreground', readableOn(branding.primaryColor))
  style.setProperty('--secondary', branding.secondaryColor)
  style.setProperty(
    '--secondary-foreground',
    readableOn(branding.secondaryColor),
  )
  style.setProperty('--accent', branding.accentColor)
  style.setProperty('--accent-foreground', readableOn(branding.accentColor))
  style.setProperty('--radius', `${branding.borderRadius / 16}rem`)

  if (branding.fontFamily) {
    style.setProperty(
      '--font-sans',
      `'${branding.fontFamily}', ui-sans-serif, system-ui, sans-serif`,
    )
  }
}

export function isOnboardingComplete(branding: Branding): boolean {
  return Boolean(branding.welcomeTitle?.trim() && branding.logoUrl)
}

export function resetBranding(): void {
  const properties = [
    '--background',
    '--foreground',
    '--card',
    '--card-foreground',
    '--popover',
    '--popover-foreground',
    '--primary',
    '--primary-foreground',
    '--secondary',
    '--secondary-foreground',
    '--accent',
    '--accent-foreground',
    '--radius',
    '--font-sans',
  ]

  for (const property of properties) {
    document.documentElement.style.removeProperty(property)
  }
}
