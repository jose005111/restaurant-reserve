import { createFileRoute, redirect } from '@tanstack/react-router'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { Pencil, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { UserFormDialog } from '@/components/users/user-form-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from '@/hooks/use-users'
import { getApiErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { UserRole } from '@/types/api'
import type { StaffUser } from '@/types/api'

export const Route = createFileRoute('/app/team')({
  beforeLoad: () => {
    if (useAuthStore.getState().user?.role !== UserRole.ADMIN) {
      throw redirect({ to: '/app' })
    }
  },
  component: TeamPage,
})

function roleLabel(role: UserRole): string {
  if (role === UserRole.ADMIN) {
    return 'Administrador'
  }

  return 'Balcão'
}

function TeamPage() {
  const currentUser = useAuthStore((state) => state.user)
  const { data: users = [], isLoading, isError } = useUsers()
  const updateMutation = useUpdateUser()
  const deleteMutation = useDeleteUser()

  const handleToggle = async (member: StaffUser) => {
    try {
      await updateMutation.mutateAsync({
        id: member.id,
        input: { isActive: !member.isActive },
      })
      toast.success(
        member.isActive ? 'Acesso desativado' : 'Acesso ativado',
      )
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível atualizar o utilizador'),
      )
    }
  }

  const handleDelete = async (member: StaffUser) => {
    try {
      await deleteMutation.mutateAsync(member.id)
      toast.success('Utilizador eliminado')
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível eliminar o utilizador'),
      )
      throw error
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equipa</h1>
          <p className="text-sm text-muted-foreground">
            Gere os acessos ao painel do restaurante.
          </p>
        </div>
        <UserFormDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utilizadores</CardTitle>
          <CardDescription>
            {users.length} utilizador(es) com acesso ao restaurante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <p className="py-8 text-center text-sm text-destructive">
              Não foi possível carregar a equipa.
            </p>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Users className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Ainda não há outros utilizadores. Cria o primeiro acesso.
              </p>
              <UserFormDialog
                trigger={
                  <Button variant="outline" size="sm">
                    Criar utilizador
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilizador</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Criado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((member) => {
                  const isSelf = member.id === currentUser?.id

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium">
                          {member.name}
                          {isSelf ? (
                            <Badge variant="outline">Tu</Badge>
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            member.role === UserRole.ADMIN
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {roleLabel(member.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={member.isActive}
                            disabled={isSelf || updateMutation.isPending}
                            onCheckedChange={() => void handleToggle(member)}
                            aria-label={`Ativar ${member.name}`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {member.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(member.createdAt), 'dd MMM yyyy', {
                          locale: pt,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <UserFormDialog
                            user={member}
                            trigger={
                              <Button variant="ghost" size="sm">
                                <Pencil className="size-4" />
                                Editar
                              </Button>
                            }
                          />
                          <ConfirmDialog
                            title={`Eliminar ${member.name}?`}
                            description="O utilizador perde imediatamente o acesso ao painel. Esta ação não pode ser revertida."
                            confirmLabel="Eliminar"
                            destructive
                            onConfirm={() => handleDelete(member)}
                            trigger={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={isSelf}
                              >
                                <Trash2 className="size-4" />
                                Eliminar
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
