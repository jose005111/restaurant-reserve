import { z } from "zod";

const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const createRestaurantSchema = z
  .object({
    name: z
      .string()
      .min(1, "Informe o nome do restaurante")
      .max(150, "Máximo de 150 caracteres"),
    slug: z
      .string()
      .max(80, "Máximo de 80 caracteres")
      .regex(
        slugRegex,
        "Use apenas minúsculas, números e hífenes (ex.: o-meu-restaurante)",
      )
      .or(z.literal(""))
      .optional(),
    phone: z.string().max(30, "Máximo de 30 caracteres").optional(),
    address: z.string().max(255, "Máximo de 255 caracteres").optional(),
    currency: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{3}$/, "Use um código de 3 letras (ex.: AOA)")
      .transform((value) => value.toUpperCase()),
    adminName: z
      .string()
      .min(1, "Informe o nome do administrador")
      .max(120, "Máximo de 120 caracteres"),
    adminEmail: z
      .string()
      .min(1, "Informe o email do administrador")
      .email("Email inválido")
      .transform((value) => value.trim().toLowerCase()),
    adminPassword: z
      .string()
      .min(8, "A password deve ter pelo menos 8 caracteres")
      .max(72, "Máximo de 72 caracteres"),
    adminPasswordConfirm: z.string().min(1, "Confirme a password"),
  })
  .refine((values) => values.adminPassword === values.adminPasswordConfirm, {
    path: ["adminPasswordConfirm"],
    message: "As passwords não coincidem",
  });

export type CreateRestaurantFormValues = z.infer<typeof createRestaurantSchema>;

export const manageRestaurantSchema = z.object({
  plan: z.enum(["FREE", "BASIC", "PRO"]),
  subscriptionExpiresAt: z.string(),
  maxTables: z.coerce.number<number>().int().min(1, "Indica pelo menos 1 mesa"),
  maxMenuItems: z.coerce
    .number<number>()
    .int()
    .min(1, "Indica pelo menos 1 item"),
  maxUsers: z.coerce
    .number<number>()
    .int()
    .min(1, "Indica pelo menos 1 utilizador"),
});

export type ManageRestaurantFormValues = z.infer<typeof manageRestaurantSchema>;
