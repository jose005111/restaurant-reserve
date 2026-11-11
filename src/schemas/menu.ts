import { z } from 'zod'
const order = z
  .number({ error: 'Indica um número válido' })
  .int('Usa um número inteiro')
  .min(0, 'O valor mínimo é 0')
  .max(2147483647, 'O valor é demasiado elevado')
export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Indica o nome')
    .max(100, 'Máximo de 100 caracteres'),
  sortOrder: order,
  isActive: z.boolean(),
})
export const menuItemSchema = z.object({
  categoryId: z.string().uuid('Escolhe uma categoria'),
  name: z
    .string()
    .trim()
    .min(1, 'Indica o nome')
    .max(150, 'Máximo de 150 caracteres'),
  description: z.string().trim().max(5000, 'Máximo de 5000 caracteres'),
  priceCents: z
    .number({ error: 'Indica um número válido' })
    .int('Usa um número inteiro de cêntimos')
    .min(0, 'O valor mínimo é 0')
    .max(2147483647, 'O valor é demasiado elevado'),
  sortOrder: order,
  isAvailable: z.boolean(),
})
export type CategoryFormValues = z.infer<typeof categorySchema>
export type MenuItemFormValues = z.infer<typeof menuItemSchema>
