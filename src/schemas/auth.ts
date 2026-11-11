import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Informe o email')
    .email('Email inválido')
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1, 'Informe a password'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
