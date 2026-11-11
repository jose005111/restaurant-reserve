import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Pencil, UserPlus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Field } from '@/components/forms/field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useCreateUser, useUpdateUser } from '@/hooks/use-users'
import { getApiErrorMessage } from '@/lib/api'
import {
  createUserSchema,
  updateUserSchema,
} from '@/schemas/staff'
import { UserRole } from '@/types/api'
import type { StaffUser } from '@/types/api'

type StaffRole = typeof UserRole.ADMIN | typeof UserRole.COUNTER

interface UserFormValues {
  name: string
  email: string
  role: StaffRole
  isActive: boolean
  password: string
}

interface UserFormDialogProps {
  trigger?: ReactNode
  user?: StaffUser
}

export function UserFormDialog({ trigger, user }: UserFormDialogProps) {
  const isEdit = Boolean(user)
  const [open, setOpen] = useState(false)
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      role: (user?.role as StaffRole | undefined) ?? UserRole.COUNTER,
      isActive: user?.isActive ?? true,
      password: '',
    },
  })

  const resetForm = () => {
    form.reset({
      name: user?.name ?? '',
      email: user?.email ?? '',
      role: (user?.role as StaffRole | undefined) ?? UserRole.COUNTER,
      isActive: user?.isActive ?? true,
      password: '',
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      resetForm()
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (user) {
        await updateMutation.mutateAsync({
          id: user.id,
          input: {
            name: values.name,
            email: values.email,
            role: values.role,
            isActive: values.isActive,
            ...(values.password ? { password: values.password } : {}),
          },
        })
        toast.success('Utilizador atualizado')
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          email: values.email,
          role: values.role,
          isActive: values.isActive,
          password: values.password,
        })
        toast.success('Utilizador criado', {
          description: 'Já pode iniciar sessão no painel.',
        })
      }

      resetForm()
      setOpen(false)
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          isEdit
            ? 'Não foi possível atualizar o utilizador'
            : 'Não foi possível criar o utilizador',
        ),
      )
    }
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <UserPlus className="size-4" />
            Novo utilizador
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar utilizador' : 'Novo utilizador'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualiza os dados de acesso do membro da equipa.'
              : 'Cria um acesso para um membro da equipa do restaurante.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field
            label="Nome"
            htmlFor="user-name"
            error={form.formState.errors.name?.message}
          >
            <Input
              id="user-name"
              placeholder="Ex.: Ana Silva"
              autoFocus
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register('name')}
            />
          </Field>

          <Field
            label="Email"
            htmlFor="user-email"
            error={form.formState.errors.email?.message}
          >
            <Input
              id="user-email"
              type="email"
              placeholder="ana@restaurante.com"
              autoComplete="off"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register('email')}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Função</p>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.ADMIN}>
                        Administrador
                      </SelectItem>
                      <SelectItem value={UserRole.COUNTER}>Balcão</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Estado</p>
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex h-9 items-center gap-2">
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <span className="text-sm text-muted-foreground">
                      {field.value ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                )}
              />
            </div>
          </div>

          <Field
            label={isEdit ? 'Nova password' : 'Password'}
            htmlFor="user-password"
            hint={
              isEdit
                ? 'Deixa vazio para manter a password atual.'
                : 'Mínimo 8 caracteres.'
            }
            error={form.formState.errors.password?.message}
          >
            <Input
              id="user-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register('password')}
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isEdit ? (
                <Pencil className="size-4" />
              ) : (
                <UserPlus className="size-4" />
              )}
              {isEdit ? 'Guardar' : 'Criar utilizador'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
