import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Loader2, UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Field } from '@/components/forms/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useCreateRestaurant,
  usePublicSignup,
} from '@/hooks/use-restaurants'
import { getApiErrorMessage } from '@/lib/api'
import {
  createRestaurantSchema,
  type CreateRestaurantFormValues,
} from '@/schemas/restaurant'
import type { Restaurant } from '@/types/api'

export interface RestaurantCreatedResult {
  restaurant: Restaurant
  email: string
  password: string
  name: string
}

interface RestaurantFormProps {
  mode: 'public' | 'admin'
  submitLabel?: string
  onCreated?: (result: RestaurantCreatedResult) => void | Promise<void>
}

export function RestaurantForm({
  mode,
  submitLabel,
  onCreated,
}: RestaurantFormProps) {
  const createMutation = useCreateRestaurant()
  const signupMutation = usePublicSignup()
  const isPending = createMutation.isPending || signupMutation.isPending

  const form = useForm<CreateRestaurantFormValues>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      name: '',
      slug: '',
      phone: '',
      address: '',
      currency: 'AOA',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      adminPasswordConfirm: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      name: values.name.trim(),
      slug: values.slug?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      address: values.address?.trim() || undefined,
      currency: values.currency.trim().toUpperCase(),
      admin: {
        name: values.adminName.trim(),
        email: values.adminEmail,
        password: values.adminPassword,
      },
    }

    try {
      const restaurant =
        mode === 'public'
          ? await signupMutation.mutateAsync(payload)
          : await createMutation.mutateAsync(payload)

      form.reset()
      await onCreated?.({
        restaurant,
        email: values.adminEmail,
        password: values.adminPassword,
        name: values.adminName.trim(),
      })
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          mode === 'public'
            ? 'Não foi possível criar a conta'
            : 'Não foi possível registar o restaurante',
        ),
      )
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Building2 className="size-4 text-muted-foreground" />
          Restaurante
        </div>

        <Field
          label="Nome"
          htmlFor="name"
          error={form.formState.errors.name?.message}
        >
          <Input
            id="name"
            placeholder="Ex.: Restaurante Sabor de Luanda"
            aria-invalid={Boolean(form.formState.errors.name)}
            {...form.register('name')}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Slug"
            htmlFor="slug"
            hint="Opcional. Gerado a partir do nome."
            error={form.formState.errors.slug?.message}
          >
            <Input
              id="slug"
              placeholder="sabor-de-luanda"
              aria-invalid={Boolean(form.formState.errors.slug)}
              {...form.register('slug')}
            />
          </Field>

          <Field
            label="Moeda"
            htmlFor="currency"
            error={form.formState.errors.currency?.message}
          >
            <Input
              id="currency"
              placeholder="AOA"
              maxLength={3}
              className="uppercase"
              aria-invalid={Boolean(form.formState.errors.currency)}
              {...form.register('currency')}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Telefone"
            htmlFor="phone"
            error={form.formState.errors.phone?.message}
          >
            <Input
              id="phone"
              placeholder="+244 900 000 000"
              {...form.register('phone')}
            />
          </Field>

          <Field
            label="Endereço"
            htmlFor="address"
            error={form.formState.errors.address?.message}
          >
            <Input
              id="address"
              placeholder="Luanda"
              {...form.register('address')}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <UserPlus className="size-4 text-muted-foreground" />
          Primeiro administrador
        </div>

        <Field
          label="Nome do administrador"
          htmlFor="adminName"
          error={form.formState.errors.adminName?.message}
        >
          <Input
            id="adminName"
            placeholder="Ex.: Ana Silva"
            aria-invalid={Boolean(form.formState.errors.adminName)}
            {...form.register('adminName')}
          />
        </Field>

        <Field
          label="Email do administrador"
          htmlFor="adminEmail"
          error={form.formState.errors.adminEmail?.message}
        >
          <Input
            id="adminEmail"
            type="email"
            placeholder="admin@restaurante.com"
            autoComplete="off"
            aria-invalid={Boolean(form.formState.errors.adminEmail)}
            {...form.register('adminEmail')}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Password"
            htmlFor="adminPassword"
            hint="Mínimo 8 caracteres."
            error={form.formState.errors.adminPassword?.message}
          >
            <Input
              id="adminPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(form.formState.errors.adminPassword)}
              {...form.register('adminPassword')}
            />
          </Field>

          <Field
            label="Confirmar password"
            htmlFor="adminPasswordConfirm"
            error={form.formState.errors.adminPasswordConfirm?.message}
          >
            <Input
              id="adminPasswordConfirm"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(
                form.formState.errors.adminPasswordConfirm,
              )}
              {...form.register('adminPasswordConfirm')}
            />
          </Field>
        </div>
      </section>

      <Button type="submit" className="h-10 w-full" disabled={isPending}>
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <UserPlus className="size-4" />
        )}
        {submitLabel ??
          (mode === 'public' ? 'Criar conta' : 'Registar restaurante')}
      </Button>
    </form>
  )
}
