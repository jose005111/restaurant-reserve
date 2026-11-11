import {
  Copy,
  Download,
  ExternalLink,
  Loader2,
  QrCode,
  RefreshCw,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useRotateTableToken, useTableQr } from '@/hooks/use-tables'
import { getApiErrorMessage } from '@/lib/api'
import type { DiningTable } from '@/types/api'

interface TableQrDialogProps {
  table: DiningTable
  trigger: ReactNode
}

function fileSafeLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

export function TableQrDialog({ table, trigger }: TableQrDialogProps) {
  const [open, setOpen] = useState(false)
  const qrQuery = useTableQr(table.id, open)
  const rotateMutation = useRotateTableToken()

  const handleCopy = async () => {
    if (!qrQuery.data) {
      return
    }

    try {
      await navigator.clipboard.writeText(qrQuery.data.url)
      toast.success('Link copiado')
    } catch {
      toast.error('Não foi possível copiar o link')
    }
  }

  const handleRotate = async () => {
    try {
      await rotateMutation.mutateAsync(table.id)
      toast.success('Novo QR gerado', {
        description: 'O código anterior deixou de funcionar.',
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível gerar novo QR'))
      throw error
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR code · {table.label}</DialogTitle>
          <DialogDescription>
            Imprime ou partilha este código. Cada mesa tem um link próprio.
          </DialogDescription>
        </DialogHeader>

        {qrQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="mx-auto size-56" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : qrQuery.isError || !qrQuery.data ? (
          <div className="space-y-3 py-6 text-center">
            <p className="text-sm text-destructive">
              Não foi possível carregar o QR code.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void qrQuery.refetch()}
            >
              <RefreshCw className="size-4" />
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center rounded-xl border bg-white p-4">
              <img
                src={qrQuery.data.qrCode}
                alt={`QR code da ${table.label}`}
                className="size-56"
              />
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs break-all text-muted-foreground">
                {qrQuery.data.url}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleCopy()}
            disabled={!qrQuery.data}
          >
            <Copy className="size-4" />
            Copiar link
          </Button>

          <div className="flex flex-wrap gap-2">
            {qrQuery.data && (
              <Button type="button" variant="outline" asChild>
                <a
                  href={qrQuery.data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-4" />
                  Abrir menu
                </a>
              </Button>
            )}
            <Button type="button" variant="outline" asChild>
              <a
                href={qrQuery.data?.qrCode}
                download={`qr-${fileSafeLabel(table.label)}.png`}
              >
                <Download className="size-4" />
                Descarregar
              </a>
            </Button>

            <ConfirmDialog
              title="Gerar novo QR code?"
              description="O QR atual deixa de funcionar imediatamente. Terás de imprimir e distribuir o novo código."
              confirmLabel="Gerar novo"
              destructive
              onConfirm={handleRotate}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  disabled={rotateMutation.isPending}
                >
                  {rotateMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <QrCode className="size-4" />
                  )}
                  Novo QR
                </Button>
              }
            />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
