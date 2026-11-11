import { z } from 'zod'
export const orderDetailsSchema = z.object({
  guestsCount: z
    .number({ error: 'Indica o número de pessoas' })
    .int('Usa um número inteiro')
    .min(1, 'Mínimo de 1 pessoa')
    .max(50, 'Máximo de 50 pessoas'),
  customerNote: z.string().trim().max(500, 'Máximo de 500 caracteres'),
})
export type OrderDetailsValues = z.infer<typeof orderDetailsSchema>
export const publicOrderSchema = orderDetailsSchema.extend({
  token: z
    .string()
    .min(1, 'Link do menu em falta')
    .max(255, 'Link do menu inválido'),
  tableId: z.string().uuid('Escolhe uma mesa válida').optional(),
  idempotencyKey: z
    .string()
    .min(1, 'Identificador do pedido em falta')
    .max(100, 'Identificador do pedido inválido'),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid('Produto inválido'),
        quantity: z
          .number({ error: 'Indica uma quantidade válida' })
          .int('Usa uma quantidade inteira')
          .min(1, 'Mínimo de 1 unidade')
          .max(99, 'Máximo de 99 unidades'),
        note: z
          .string()
          .trim()
          .max(255, 'Máximo de 255 caracteres')
          .nullable()
          .optional(),
      }),
    )
    .min(1, 'Adiciona pelo menos um produto')
    .max(50, 'Máximo de 50 produtos diferentes'),
})
