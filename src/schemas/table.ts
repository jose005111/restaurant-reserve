import { z } from 'zod'

export const tableSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'Informe o nome ou número da mesa')
    .max(30, 'Máximo de 30 caracteres'),
})

export type TableFormValues = z.infer<typeof tableSchema>
