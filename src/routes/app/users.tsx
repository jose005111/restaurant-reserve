import { createFileRoute, redirect } from "@tanstack/react-router";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PlatformUserDialog } from "@/components/users/platform-user-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRestaurants } from "@/hooks/use-restaurants";
import { useUpdateUser, useUsers } from "@/hooks/use-users";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { UserRole, type UserQuery } from "@/types/api";

export const Route = createFileRoute("/app/users")({
  beforeLoad: () => {
    if (useAuthStore.getState().user?.role !== UserRole.SUPER_ADMIN)
      throw redirect({ to: "/app" });
  },
  component: PlatformUsersPage,
});

function roleLabel(role: UserRole) {
  if (role === UserRole.SUPER_ADMIN) return "Super Admin";
  return role === UserRole.ADMIN ? "Administrador" : "Balcão";
}

function PlatformUsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [role, setRole] = useState<UserQuery["role"] | "">("");
  const [restaurantId, setRestaurantId] = useState("");
  const [isActive, setIsActive] = useState<UserQuery["isActive"] | "">("");
  const { data: restaurants = [] } = useRestaurants();
  const {
    data: users = [],
    isLoading,
    isError,
  } = useUsers({
    ...(role ? { role } : {}),
    ...(restaurantId ? { restaurantId } : {}),
    ...(isActive ? { isActive } : {}),
  });
  const update = useUpdateUser();
  const restaurantNames = new Map(
    restaurants.map((restaurant) => [restaurant.id, restaurant.name]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Utilizadores da plataforma
        </h1>
        <p className="text-sm text-muted-foreground">
          Consulta e gere os acessos de todos os restaurantes.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtra por função, restaurante e estado de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-2 text-sm font-medium">
            Função
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as typeof role)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Administrador</option>
              <option value="COUNTER">Balcão</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            Restaurante
            <select
              value={restaurantId}
              onChange={(event) => setRestaurantId(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos</option>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            Estado
            <select
              value={isActive}
              onChange={(event) =>
                setIsActive(event.target.value as typeof isActive)
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos</option>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Utilizadores</CardTitle>
          <CardDescription>{users.length} resultado(s).</CardDescription>
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
              Não foi possível carregar os utilizadores.
            </p>
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum utilizador corresponde aos filtros.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilizador</TableHead>
                    <TableHead>Restaurante</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Criado</TableHead>
                    <TableHead>Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const self = user.id === currentUser?.id;
                    const restaurantName = user.restaurantId
                      ? (restaurantNames.get(user.restaurantId) ??
                        "Restaurante desconhecido")
                      : "Plataforma";
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">
                            {user.name}{" "}
                            {self ? <Badge variant="outline">Tu</Badge> : null}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>{restaurantName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {roleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.isActive ? "default" : "destructive"}
                          >
                            {user.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(user.createdAt), "dd/MM/yyyy", {
                            locale: pt,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <PlatformUserDialog
                              user={user}
                              restaurantName={restaurantName}
                            />
                            <ConfirmDialog
                              trigger={
                                <Button
                                  size="sm"
                                  variant={
                                    user.isActive ? "destructive" : "outline"
                                  }
                                  disabled={self}
                                >
                                  {user.isActive ? "Inactivar" : "Activar"}
                                </Button>
                              }
                              title={`${user.isActive ? "Inactivar" : "Activar"} ${user.name}?`}
                              description={
                                user.isActive
                                  ? "O utilizador deixará de poder aceder à aplicação, incluindo com sessões já abertas."
                                  : "O utilizador poderá voltar a iniciar sessão."
                              }
                              confirmLabel={
                                user.isActive
                                  ? "Inactivar utilizador"
                                  : "Activar utilizador"
                              }
                              destructive={user.isActive}
                              onConfirm={async () => {
                                try {
                                  await update.mutateAsync({
                                    id: user.id,
                                    input: { isActive: !user.isActive },
                                  });
                                  toast.success(
                                    user.isActive
                                      ? "Utilizador inactivado"
                                      : "Utilizador activado",
                                  );
                                } catch (error) {
                                  toast.error(
                                    getApiErrorMessage(
                                      error,
                                      "Não foi possível alterar o estado",
                                    ),
                                  );
                                  throw error;
                                }
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
