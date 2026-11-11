import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AuthShell } from '@/components/auth/auth-shell'
import { Field } from '@/components/forms/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLogin } from '@/hooks/use-auth'
import { getApiErrorMessage } from '@/lib/api'
import { env } from '@/lib/env'
import { loginSchema, type LoginFormValues } from '@/schemas/auth'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (useAuthStore.getState().token) {
      throw redirect({ to: '/app' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await loginMutation.mutateAsync(values)
      toast.success('Bem-vindo de volta!')
      await navigate({ to: '/app' })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível entrar'))
    }
  })

  return (
    <AuthShell
      title="Entrar no painel"
      description="Acede à conta do teu restaurante para gerir o menu e os pedidos."
      footer={
        env.allowPublicSignup ? (
          <p>
            Ainda não tens conta?{' '}
            <Link
              to="/signup"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Criar conta grátis
            </Link>
            .
          </p>
        ) : (
          <p>
            O registo de restaurantes é feito pelo administrador da
            plataforma.
          </p>
        )
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field
          label="Email"
          htmlFor="email"
          error={form.formState.errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nome@restaurante.com"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register('email')}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={form.formState.errors.password?.message}
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pr-10"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={
                showPassword ? 'Esconder password' : 'Mostrar password'
              }
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </Field>

        <Button
          type="submit"
          className="h-10 w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogIn className="size-4" />
          )}
          Entrar
        </Button>
      </form>
    </AuthShell>
  )
}
