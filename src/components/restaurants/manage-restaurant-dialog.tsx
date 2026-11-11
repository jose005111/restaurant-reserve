import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Activity, Loader2, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useRestaurantActivity,
  useUpdateRestaurant,
  useUpdateRestaurantStatus,
} from "@/hooks/use-restaurants";
import { getApiErrorMessage } from "@/lib/api";
import {
  manageRestaurantSchema,
  type ManageRestaurantFormValues,
} from "@/schemas/restaurant";
import { RestaurantStatus, type Restaurant } from "@/types/api";

function formValues(restaurant: Restaurant): ManageRestaurantFormValues {
  return {
    plan: restaurant.plan,
    subscriptionExpiresAt: restaurant.subscriptionExpiresAt
      ? format(new Date(restaurant.subscriptionExpiresAt), "yyyy-MM-dd'T'HH:mm")
      : "",
    maxTables: restaurant.maxTables,
    maxMenuItems: restaurant.maxMenuItems,
    maxUsers: restaurant.maxUsers,
  };
}

export function ManageRestaurantDialog({
  restaurant,
}: {
  restaurant: Restaurant;
}) {
  const [open, setOpen] = useState(false);
  const activity = useRestaurantActivity(restaurant.id, open);
  const update = useUpdateRestaurant();
  const updateStatus = useUpdateRestaurantStatus();
  const form = useForm<ManageRestaurantFormValues>({
    resolver: zodResolver(manageRestaurantSchema),
    defaultValues: formValues(restaurant),
  });

  useEffect(() => {
    if (!open) form.reset(formValues(restaurant));
  }, [open, restaurant, form]);

  const save = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync({
        id: restaurant.id,
        input: {
          plan: values.plan,
          subscriptionExpiresAt: values.subscriptionExpiresAt
            ? new Date(values.subscriptionExpiresAt).toISOString()
            : null,
          maxTables: values.maxTables,
          maxMenuItems: values.maxMenuItems,
          maxUsers: values.maxUsers,
        },
      });
      toast.success("Plano e limites actualizados");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Não foi possível actualizar o restaurante"),
      );
    }
  });

  const suspended = restaurant.status === RestaurantStatus.SUSPENDED;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Gerir ${restaurant.name}`}
        >
          <Settings2 className="size-4" /> Gerir
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{restaurant.name}</DialogTitle>
          <DialogDescription>
            Plano, limites e actividade do restaurante.
          </DialogDescription>
        </DialogHeader>

        <section
          className="space-y-3 rounded-lg border p-4"
          aria-label="Actividade"
        >
          <div className="flex items-center gap-2 font-medium">
            <Activity className="size-4" /> Actividade
          </div>
          {activity.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : activity.isError ? (
            <p className="text-sm text-destructive">
              Não foi possível carregar a actividade.
            </p>
          ) : activity.data ? (
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <Metric
                label="Pedidos (30 dias)"
                value={activity.data.ordersCount30Days}
              />
              <Metric
                label="Vendas aceites (30 dias)"
                value={new Intl.NumberFormat("pt-AO", {
                  style: "currency",
                  currency: restaurant.currency,
                }).format(activity.data.salesCents30Days / 100)}
              />
              <Metric
                label="Último pedido"
                value={
                  activity.data.lastOrderAt
                    ? format(
                        new Date(activity.data.lastOrderAt),
                        "dd/MM/yyyy HH:mm",
                      )
                    : "Sem pedidos"
                }
              />
              <Metric
                label="Mesas"
                value={`${activity.data.tablesCount} / ${restaurant.maxTables}`}
              />
              <Metric
                label="Itens do menu"
                value={`${activity.data.menuItemsCount} / ${restaurant.maxMenuItems}`}
              />
              <Metric
                label="Utilizadores activos"
                value={`${activity.data.activeUsersCount} / ${restaurant.maxUsers}`}
              />
            </div>
          ) : null}
        </section>

        <form onSubmit={save} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Plano"
              htmlFor={`plan-${restaurant.id}`}
              error={form.formState.errors.plan?.message}
            >
              <select
                id={`plan-${restaurant.id}`}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register("plan")}
              >
                <option value="FREE">Free</option>
                <option value="BASIC">Basic</option>
                <option value="PRO">Pro</option>
              </select>
            </Field>
            <Field
              label="Validade da subscrição"
              htmlFor={`expiry-${restaurant.id}`}
              hint="Deixa vazio para não expirar."
              error={form.formState.errors.subscriptionExpiresAt?.message}
            >
              <Input
                id={`expiry-${restaurant.id}`}
                type="datetime-local"
                {...form.register("subscriptionExpiresAt")}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Máximo de mesas"
              htmlFor={`tables-${restaurant.id}`}
              error={form.formState.errors.maxTables?.message}
            >
              <Input
                id={`tables-${restaurant.id}`}
                type="number"
                min="1"
                {...form.register("maxTables")}
              />
            </Field>
            <Field
              label="Máximo de itens"
              htmlFor={`items-${restaurant.id}`}
              error={form.formState.errors.maxMenuItems?.message}
            >
              <Input
                id={`items-${restaurant.id}`}
                type="number"
                min="1"
                {...form.register("maxMenuItems")}
              />
            </Field>
            <Field
              label="Máximo de utilizadores"
              htmlFor={`users-${restaurant.id}`}
              error={form.formState.errors.maxUsers?.message}
            >
              <Input
                id={`users-${restaurant.id}`}
                type="number"
                min="1"
                {...form.register("maxUsers")}
              />
            </Field>
          </div>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}{" "}
            Guardar plano e limites
          </Button>
        </form>

        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Estado: {suspended ? "Suspenso" : "Activo"}
          </p>
          <ConfirmDialog
            trigger={
              <Button variant={suspended ? "outline" : "destructive"}>
                {suspended ? "Reactivar" : "Suspender"}
              </Button>
            }
            title={`${suspended ? "Reactivar" : "Suspender"} ${restaurant.name}?`}
            description={
              suspended
                ? "O restaurante e os seus clientes poderão voltar a utilizar o serviço."
                : "O acesso do staff e os endpoints públicos deste restaurante serão bloqueados."
            }
            confirmLabel={
              suspended ? "Reactivar restaurante" : "Suspender restaurante"
            }
            destructive={!suspended}
            onConfirm={async () => {
              try {
                await updateStatus.mutateAsync({
                  id: restaurant.id,
                  input: {
                    status: suspended
                      ? RestaurantStatus.ACTIVE
                      : RestaurantStatus.SUSPENDED,
                  },
                });
                toast.success(
                  suspended ? "Restaurante reactivado" : "Restaurante suspenso",
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
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
