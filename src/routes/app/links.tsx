import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  Copy,
  Download,
  ExternalLink,
  Link2,
  Loader2,
  QrCode,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useGenericLink, useRotateGenericLink } from '@/hooks/use-links'
import { getApiErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { UserRole } from '@/types/api'

export const Route = createFileRoute('/app/links')({
  beforeLoad: () => {
    if (useAuthStore.getState().user?.role !== UserRole.ADMIN) {
      throw redirect({ to: '/app' })
    }
  },
  component: LinksPage,
})

function LinksPage() {
  const linkQuery = useGenericLink()
  const rotateMutation = useRotateGenericLink()

  const handleCopy = async () => {
    if (!linkQuery.data) {
      return
    }

    try {
      await navigator.clipboard.writeText(linkQuery.data.url)
      toast.success('Link copiado')
    } catch {
      toast.error('Não foi possível copiar o link')
    }
  }

  const handleRotate = async () => {
    try {
      await rotateMutation.mutateAsync()
      toast.success('Novo link gerado', {
        description: 'O link e QR anteriores deixaram de funcionar.',
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível gerar novo link'))
      throw error
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Links & QR codes
        </h1>
        <p className="text-sm text-muted-foreground">
          Um link único para partilhar o menu do restaurante sem indicar mesa.
        </p>
      </div>

      {linkQuery.isLoading ? (
        <Card>
          <CardContent className="grid gap-6 py-8 sm:grid-cols-[auto_1fr]">
            <Skeleton className="size-56" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      ) : linkQuery.isError || !linkQuery.data ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Link2 className="size-8 text-muted-foreground" />
            <p className="text-sm text-destructive">
              Não foi possível carregar o link do restaurante.
            </p>
            <Button
              variant="outline"
              onClick={() => void linkQuery.refetch()}
            >
              <RefreshCw className="size-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardContent className="flex justify-center pt-6">
              <div className="rounded-xl border bg-white p-4">
                <img
                  src={linkQuery.data.qrCode}
                  alt="QR code do menu do restaurante"
                  className="size-56"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="size-4" />
                  Link genérico
                </CardTitle>
                <CardDescription>
                  Usa este link nas redes sociais, na bio ou em materiais
                  impressos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs break-all text-muted-foreground">
                    {linkQuery.data.url}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" asChild>
                    <a
                      href={linkQuery.data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-4" />
                      Abrir menu
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleCopy()}
                  >
                    <Copy className="size-4" />
                    Copiar link
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <a
                      href={linkQuery.data.qrCode}
                      download="qr-menu-restaurante.png"
                    >
                      <Download className="size-4" />
                      Descarregar QR
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="size-4" />
                  Segurança
                </CardTitle>
                <CardDescription>
                  Se o link for partilhado indevidamente, gera um novo. Os
                  códigos antigos deixam de funcionar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConfirmDialog
                  title="Gerar novo link e QR?"
                  description="O link atual deixa de funcionar imediatamente. Terás de atualizar todos os locais onde o partilhaste."
                  confirmLabel="Gerar novo"
                  destructive
                  onConfirm={handleRotate}
                  trigger={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={rotateMutation.isPending}
                    >
                      {rotateMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      Gerar novo link
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
