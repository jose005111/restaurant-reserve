import type { ReactNode } from 'react'
import { UtensilsCrossed } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/theme-toggle'

interface AuthShellProps {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#111827] p-12 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              'radial-gradient(circle at 15% 20%, rgba(245,158,11,0.35), transparent 45%), radial-gradient(circle at 85% 75%, rgba(99,102,241,0.35), transparent 45%)',
          }}
        />
        <div className="relative flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <UtensilsCrossed className="size-6" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-wide">
              Restaurant Reserve
            </p>
            <p className="text-xs text-white/60">Pedidos por QR code</p>
          </div>
        </div>

        <div className="relative max-w-md space-y-6">
          <h2 className="text-4xl font-semibold tracking-tight text-balance">
            A identidade do teu restaurante, do menu ao balcão.
          </h2>
          <p className="text-base text-white/70">
            Configura a marca, acompanha os pedidos em tempo real e mantém a
            equipa alinhada num só painel.
          </p>
          <ul className="space-y-3 text-sm text-white/80">
            <li>• Onboarding guiado da identidade visual</li>
            <li>• Menu e pedidos por QR code</li>
            <li>• Fila do balcão em tempo real</li>
          </ul>
        </div>

        <p className="relative text-xs text-white/40">
          © {new Date().getFullYear()} Restaurant Reserve
        </p>
      </aside>

      <main className="relative flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <UtensilsCrossed className="size-5" />
            </span>
            <p className="text-base font-semibold">Restaurant Reserve</p>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="mt-8">{children}</div>

          {footer ? (
            <div className="mt-8 text-sm text-muted-foreground">{footer}</div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
