import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useAcceptOrder,
  useChangeOrderStatus,
  useRejectOrder,
  useStaffOrders,
} from "@/hooks/use-staff-orders";
import { useAuthStore } from "@/stores/auth-store";
import { UserRole } from "@/types/api";
import type { StaffOrder, StaffOrderQuery } from "@/types/api";

export const Route = createFileRoute("/app/orders")({
  beforeLoad: () => {
    const role = useAuthStore.getState().user?.role;
    if (role !== UserRole.ADMIN && role !== UserRole.COUNTER)
      throw redirect({ to: "/app" });
  },
  component: OrdersPage,
});

const labels: Record<StaffOrder["status"], string> = {
  PENDING: "Pendente",
  ACCEPTED: "Aceite",
  PREPARING: "Em preparação",
  READY: "Pronto",
  DELIVERED: "Entregue",
  REJECTED: "Rejeitado",
  CANCELLED: "Cancelado",
};
const acceptSchema = z.object({
  estimatedPrepMinutes: z.coerce.number<number>().int().min(1).max(240),
  note: z.string().max(500),
});
const rejectSchema = z.object({
  reason: z.string().trim().min(1, "Indica o motivo").max(255),
});
type AcceptForm = z.infer<typeof acceptSchema>;
type RejectForm = z.infer<typeof rejectSchema>;

function OrdersPage() {
  const [query, setQuery] = useState<StaffOrderQuery>({ page: 1, limit: 20 });
  const { data, isLoading, isError, refetch, isFetching } =
    useStaffOrders(query);
  const setFilter = (change: Partial<StaffOrderQuery>) =>
    setQuery((previous) => ({ ...previous, ...change, page: 1 }));
  const tables = Array.from(
    new Map(
      data?.items.map((order) => [order.tableId, order.tableLabel]) ?? [],
    ).entries(),
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pedidos</h1>
          <p className="text-sm text-muted-foreground">
            Fila do balcão e histórico do restaurante.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          Actualizar
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="order-status">Estado</Label>
          <select
            id="order-status"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={query.status ?? ""}
            onChange={(event) =>
              setFilter({
                status: (event.target.value ||
                  undefined) as StaffOrderQuery["status"],
              })
            }
          >
            <option value="">Todos</option>
            {Object.entries(labels).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="order-date">Data</Label>
          <Input
            id="order-date"
            type="date"
            value={query.date ?? ""}
            onChange={(event) =>
              setFilter({ date: event.target.value || undefined })
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="order-table">Mesa na página</Label>
          <select
            id="order-table"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={query.tableId ?? ""}
            onChange={(event) =>
              setFilter({ tableId: event.target.value || undefined })
            }
          >
            <option value="">Todas</option>
            {query.tableId && !tables.some(([id]) => id === query.tableId) && (
              <option value={query.tableId}>Mesa seleccionada</option>
            )}
            {tables.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">A carregar pedidos…</p>
      ) : isError ? (
        <p role="alert">Não foi possível carregar os pedidos.</p>
      ) : data?.items.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {data.items.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border p-8 text-center text-muted-foreground">
          Nenhum pedido encontrado.
        </p>
      )}
      {data && data.meta.totalPages > 1 ? (
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            disabled={query.page === 1}
            onClick={() =>
              setQuery((value) => ({ ...value, page: (value.page ?? 1) - 1 }))
            }
          >
            Anterior
          </Button>
          <span className="text-sm">
            {data.meta.page} / {data.meta.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={query.page === data.meta.totalPages}
            onClick={() =>
              setQuery((value) => ({ ...value, page: (value.page ?? 1) + 1 }))
            }
          >
            Seguinte
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function OrderCard({ order }: { order: StaffOrder }) {
  const [action, setAction] = useState<"accept" | "reject" | null>(null);
  const accept = useAcceptOrder();
  const reject = useRejectOrder();
  const change = useChangeOrderStatus();
  const acceptForm = useForm<AcceptForm>({
    resolver: zodResolver(acceptSchema),
    defaultValues: { estimatedPrepMinutes: 30, note: "" },
  });
  const rejectForm = useForm<RejectForm>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: "" },
  });
  const next =
    order.status === "ACCEPTED"
      ? "PREPARING"
      : order.status === "PREPARING"
        ? "READY"
        : order.status === "READY"
          ? "DELIVERED"
          : null;
  const nextLabel =
    next === "PREPARING"
      ? "Iniciar preparação"
      : next === "READY"
        ? "Marcar pronto"
        : "Marcar entregue";
  const busy = accept.isPending || reject.isPending || change.isPending;
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>
            #{String(order.number).padStart(3, "0")} · {order.tableLabel}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleString("pt-AO")} ·{" "}
            {order.guestsCount} pessoa(s)
          </p>
        </div>
        <Badge variant={order.status === "PENDING" ? "default" : "secondary"}>
          {labels[order.status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2 text-sm">
          {order.items.map((item, index) => (
            <li key={index}>
              <span className="font-medium">
                {item.quantity} × {item.nameSnapshot}
              </span>
              {item.note && (
                <p className="text-muted-foreground">{item.note}</p>
              )}
            </li>
          ))}
        </ul>
        {order.customerNote && (
          <p className="rounded-md bg-muted p-2 text-sm">
            Nota: {order.customerNote}
          </p>
        )}
        {order.staffNote && (
          <p className="text-sm text-muted-foreground">
            Nota interna: {order.staffNote}
          </p>
        )}
        {order.rejectionReason && (
          <p className="text-sm">Motivo: {order.rejectionReason}</p>
        )}
        {order.estimatedPrepMinutes && (
          <p className="text-sm">Previsão: {order.estimatedPrepMinutes} min</p>
        )}
        <p className="font-semibold">
          Total: {order.totalCents.toLocaleString("pt-AO")} cêntimos
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {order.status === "PENDING" && (
          <>
            <Button
              disabled={busy}
              onClick={() => setAction(action === "accept" ? null : "accept")}
            >
              Aceitar
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => setAction(action === "reject" ? null : "reject")}
            >
              Rejeitar
            </Button>
          </>
        )}
        {next && (
          <Button
            disabled={busy}
            onClick={() =>
              change.mutate({ id: order.id, input: { status: next } })
            }
          >
            {nextLabel}
          </Button>
        )}
        {(order.status === "ACCEPTED" || order.status === "PREPARING") && (
          <ConfirmDialog
            trigger={
              <Button variant="outline" disabled={busy}>
                Cancelar
              </Button>
            }
            title="Cancelar pedido"
            description="Esta acção cancela o pedido e informa o cliente no acompanhamento."
            confirmLabel="Cancelar pedido"
            destructive
            onConfirm={async () => {
              await change.mutateAsync({
                id: order.id,
                input: { status: "CANCELLED" },
              });
            }}
          />
        )}
      </CardFooter>
      {action === "accept" && (
        <form
          className="space-y-3 border-t p-4"
          onSubmit={acceptForm.handleSubmit(async (values) => {
            try {
              await accept.mutateAsync({
                id: order.id,
                input: {
                  estimatedPrepMinutes: values.estimatedPrepMinutes,
                  note: values.note || undefined,
                },
              });
              setAction(null);
            } catch {
              /* The mutation displays the API error. */
            }
          })}
        >
          <Label htmlFor={`minutes-${order.id}`}>
            Tempo estimado (minutos)
          </Label>
          <Input
            id={`minutes-${order.id}`}
            type="number"
            min="1"
            max="240"
            {...acceptForm.register("estimatedPrepMinutes")}
          />
          {acceptForm.formState.errors.estimatedPrepMinutes && (
            <p role="alert" className="text-sm text-destructive">
              Indica 1 a 240 minutos.
            </p>
          )}
          <Label htmlFor={`note-${order.id}`}>Nota interna (opcional)</Label>
          <Textarea id={`note-${order.id}`} {...acceptForm.register("note")} />
          <Button type="submit" disabled={busy}>
            Confirmar aceitação
          </Button>
        </form>
      )}
      {action === "reject" && (
        <form
          className="space-y-3 border-t p-4"
          onSubmit={rejectForm.handleSubmit(async (values) => {
            try {
              await reject.mutateAsync({ id: order.id, input: values });
              setAction(null);
            } catch {
              /* The mutation displays the API error. */
            }
          })}
        >
          <Label htmlFor={`reason-${order.id}`}>Motivo da rejeição</Label>
          <Textarea
            id={`reason-${order.id}`}
            {...rejectForm.register("reason")}
          />
          {rejectForm.formState.errors.reason && (
            <p role="alert" className="text-sm text-destructive">
              {rejectForm.formState.errors.reason.message}
            </p>
          )}
          <Button type="submit" variant="destructive" disabled={busy}>
            Confirmar rejeição
          </Button>
        </form>
      )}
    </Card>
  );
}
