import { createFileRoute, redirect } from '@tanstack/react-router'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { Pencil, QrCode, Store, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { TableFormDialog } from '@/components/tables/table-form-dialog'
import { TableQrDialog } from '@/components/tables/table-qr-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  useDeleteTable,
  useTables,
  useUpdateTable,
} from '@/hooks/use-tables'
import { getApiErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { UserRole } from '@/types/api'
import type { DiningTable } from '@/types/api'

export const Route = createFileRoute('/app/tables')({
  beforeLoad: () => {
    if (useAuthStore.getState().user?.role !== UserRole.ADMIN) {
      throw redirect({ to: '/app' })
    }
  },
  component: TablesPage,
})

function TablesPage() {
  const { data: tables = [], isLoading, isError } = useTables()
  const updateMutation = useUpdateTable()
  const deleteMutation = useDeleteTable()

  const handleToggle = async (table: DiningTable) => {
    try {
      await updateMutation.mutateAsync({
        id: table.id,
        input: { isActive: !table.isActive },
      })
      toast.success(
        table.isActive ? 'Mesa desativada' : 'Mesa ativada',
      )
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível atualizar a mesa'),
      )
    }
  }

  const handleDelete = async (table: DiningTable) => {
    try {
      await deleteMutation.mutateAsync(table.id)
      toast.success('Mesa eliminada')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível eliminar a mesa'))
      throw error
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mesas</h1>
          <p className="text-sm text-muted-foreground">
            Gere as mesas do restaurante e os respetivos QR codes.
          </p>
        </div>
        <TableFormDialog />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="py-12 text-center text-sm text-destructive">
          Não foi possível carregar as mesas.
        </p>
      ) : tables.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Store className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Ainda não há mesas</p>
              <p className="text-sm text-muted-foreground">
                Cria a primeira mesa para gerar o respetivo QR code.
              </p>
            </div>
            <TableFormDialog
              trigger={
                <Button variant="outline" size="sm">
                  Criar mesa
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => (
            <Card key={table.id} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {table.label}
                  <Badge variant={table.isActive ? 'default' : 'secondary'}>
                    {table.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Criada a{' '}
                  {format(new Date(table.createdAt), 'dd MMM yyyy', {
                    locale: pt,
                  })}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Disponível</p>
                    <p className="text-xs text-muted-foreground">
                      Clientes podem aceder ao menu
                    </p>
                  </div>
                  <Switch
                    checked={table.isActive}
                    disabled={updateMutation.isPending}
                    onCheckedChange={() => void handleToggle(table)}
                    aria-label={`Ativar ${table.label}`}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-wrap gap-2 border-t">
                <TableQrDialog
                  table={table}
                  trigger={
                    <Button variant="outline" size="sm">
                      <QrCode className="size-4" />
                      QR code
                    </Button>
                  }
                />
                <TableFormDialog
                  table={table}
                  trigger={
                    <Button variant="ghost" size="sm">
                      <Pencil className="size-4" />
                      Editar
                    </Button>
                  }
                />
                <ConfirmDialog
                  title={`Eliminar ${table.label}?`}
                  description="O QR code desta mesa deixa de funcionar. Esta ação não pode ser revertida."
                  confirmLabel="Eliminar"
                  destructive
                  onConfirm={() => handleDelete(table)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                      Eliminar
                    </Button>
                  }
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
