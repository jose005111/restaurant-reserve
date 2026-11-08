import { z } from 'zod'

const staffRole = z.enum(['ADMIN', 'COUNTER'])

const staffBase = {
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome')
    .max(120, 'Máximo de 120 caracteres'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Informe o email')
    .email('Email inválido')
    .max(255, 'Máximo de 255 caracteres'),
  role: staffRole,
  isActive: z.boolean(),
}

export const createUserSchema = z.object({
  ...staffBase,
  password: z
    .string()
    .min(8, 'A password deve ter pelo menos 8 caracteres')
    .max(72, 'Máximo de 72 caracteres'),
})

export const updateUserSchema = z.object({
  ...staffBase,
  password: z
    .string()
    .max(72, 'Máximo de 72 caracteres')
    .refine(
      (value) => value === '' || value.length >= 8,
      'A password deve ter pelo menos 8 caracteres',
    ),
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>
