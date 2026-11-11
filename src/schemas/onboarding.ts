import { z } from 'zod'
import type { UpdateBrandingInput } from '@/types/api'

export const BRANDING_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Nunito',
  'Source Sans 3',
  'Playfair Display',
] as const satisfies readonly NonNullable<UpdateBrandingInput['fontFamily']>[]

const hexColor = /^#[0-9A-Fa-f]{6}$/

const httpsUrl = z
  .string()
  .max(255, 'Máximo de 255 caracteres')
  .refine(
    (value) => value === '' || /^https:\/\/.+/i.test(value),
    'Use uma URL que comece por https://',
  )

export const onboardingSchema = z.object({
  fontFamily: z.union([z.literal(''), z.enum(BRANDING_FONTS)]),
  welcomeTitle: z
    .string()
    .trim()
    .min(1, 'Informe o título de boas-vindas')
    .max(120, 'Máximo de 120 caracteres'),
  welcomeMessage: z.string().max(300, 'Máximo de 300 caracteres'),
  footerText: z.string().max(200, 'Máximo de 200 caracteres'),
  primaryColor: z.string().regex(hexColor, 'Cor inválida'),
  secondaryColor: z.string().regex(hexColor, 'Cor inválida'),
  accentColor: z.string().regex(hexColor, 'Cor inválida'),
  backgroundColor: z.string().regex(hexColor, 'Cor inválida'),
  surfaceColor: z.string().regex(hexColor, 'Cor inválida'),
  textColor: z.string().regex(hexColor, 'Cor inválida'),
  themeMode: z.enum(['LIGHT', 'DARK', 'SYSTEM']),
  borderRadius: z.number().min(0, 'Mínimo 0').max(32, 'Máximo 32'),
  instagramUrl: httpsUrl,
  facebookUrl: httpsUrl,
  websiteUrl: httpsUrl,
  whatsapp: z.string().max(30, 'Máximo de 30 caracteres'),
})

export type OnboardingFormValues = z.infer<typeof onboardingSchema>
