import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { toast } from 'sonner'
import { AuthShell } from '@/components/auth/auth-shell'
import {
  RestaurantForm,
  type RestaurantCreatedResult,
} from '@/components/restaurants/restaurant-form'
import { useLogin } from '@/hooks/use-auth'
import { getApiErrorMessage } from '@/lib/api'
import { env } from '@/lib/env'
import { useAuthStore } from '@/stores/auth-store'
import { UserRole } from '@/types/api'

export const Route = createFileRoute('/signup')({
  beforeLoad: () => {
    const { token, user } = useAuthStore.getState()

    if (env.allowPublicSignup) {
      if (token) {
        throw redirect({ to: '/app' })
      }
      return
    }

    if (!token) {
      throw redirect({ to: '/login' })
    }

    if (user?.role !== UserRole.SUPER_ADMIN) {
      throw redirect({ to: '/app' })
    }

    throw redirect({ to: '/app/restaurants' })
  },
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()
  const loginMutation = useLogin()

  const handleCreated = async ({
    email,
    password,
  }: RestaurantCreatedResult) => {
    try {
      await loginMutation.mutateAsync({ email, password })
      toast.success('Conta criada!', {
        description: 'Vamos configurar a identidade do teu restaurante.',
      })
      await navigate({ to: '/app/onboarding' })
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Conta criada, mas não foi possível entrar automaticamente',
        ),
      )
      await navigate({ to: '/login' })
    }
  }

  return (
    <AuthShell
      title="Criar conta no plano Free"
      description="Regista o teu restaurante e configura a identidade. O acesso ao painel é imediato."
      footer={
        <p>
          Já tens conta?{' '}
          <Link
            to="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </p>
      }
    >
      <div className="mb-6 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        Plano <span className="font-semibold text-foreground">FREE</span>: até
        10 mesas, 50 itens de menu e 5 utilizadores. Sem cartão de crédito.
      </div>

      <RestaurantForm
        mode="public"
        submitLabel="Criar conta grátis"
        onCreated={handleCreated}
      />
    </AuthShell>
  )
}
