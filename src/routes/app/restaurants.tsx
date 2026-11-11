import { createFileRoute, redirect } from "@tanstack/react-router";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Building2, Plus, Store } from "lucide-react";
import { CreateRestaurantDialog } from "@/components/restaurants/create-restaurant-dialog";
import { ManageRestaurantDialog } from "@/components/restaurants/manage-restaurant-dialog";
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
import { getRestaurantAvailability } from "@/lib/restaurant-status";
import { useAuthStore } from "@/stores/auth-store";
import { UserRole } from "@/types/api";

export const Route = createFileRoute("/app/restaurants")({
  beforeLoad: () => {
    if (useAuthStore.getState().user?.role !== UserRole.SUPER_ADMIN) {
      throw redirect({ to: "/app" });
    }
  },
  component: RestaurantsPage,
});

function RestaurantsPage() {
  const { data: restaurants = [], isLoading, isError } = useRestaurants();

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Restaurantes
          </h1>
          <p className="text-sm text-muted-foreground">
            Todos os tenants registados na plataforma.
          </p>
        </div>
        <CreateRestaurantDialog
          trigger={
            <Button>
              <Plus className="size-4" />
              Novo restaurante
            </Button>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenants</CardTitle>
          <CardDescription>
            {restaurants.length} restaurante(s) no total.
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
              Não foi possível carregar os restaurantes.
            </p>
          ) : restaurants.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Store className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Ainda não há restaurantes. Cria o primeiro tenant.
              </p>
              <CreateRestaurantDialog
                trigger={
                  <Button variant="outline" size="sm">
                    <Building2 className="size-4" />
                    Registar restaurante
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurante</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Limites</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Criado</TableHead>
                  <TableHead>Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restaurants.map((restaurant) => (
                  <TableRow key={restaurant.id}>
                    <TableCell>
                      <div className="font-medium">{restaurant.name}</div>
                      <div className="text-xs text-muted-foreground">
                        /{restaurant.slug} · {restaurant.currency}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{restaurant.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          getRestaurantAvailability(restaurant) === "active"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {getRestaurantAvailability(restaurant) === "active"
                          ? "Activo"
                          : getRestaurantAvailability(restaurant) === "expired"
                            ? "Expirado"
                            : "Suspenso"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {restaurant.maxTables} mesas · {restaurant.maxMenuItems}{" "}
                      itens · {restaurant.maxUsers} users
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {restaurant.subscriptionExpiresAt
                        ? format(
                            new Date(restaurant.subscriptionExpiresAt),
                            "dd/MM/yyyy HH:mm",
                            { locale: pt },
                          )
                        : "Sem expiração"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(restaurant.createdAt), "dd/MM/yyyy", {
                        locale: pt,
                      })}
                    </TableCell>
                    <TableCell>
                      <ManageRestaurantDialog restaurant={restaurant} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
