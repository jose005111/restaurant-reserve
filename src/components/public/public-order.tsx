import { Clock, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
  useCancelPublicOrder,
  usePublicOrder,
  isFinalOrderStatus,
} from "@/hooks/use-public-orders";
import { getApiErrorMessage } from "@/lib/api";
import { useCartStore } from "@/stores/cart-store";
import type { PublicOrderStatus } from "@/types/api";
const statusLabels: Record<PublicOrderStatus, string> = {
  PENDING: "Pendente",
  ACCEPTED: "Aceite",
  PREPARING: "Em preparação",
  READY: "Pronto",
  DELIVERED: "Entregue",
  REJECTED: "Rejeitado",
  CANCELLED: "Cancelado",
};
export function PublicOrderPage({ publicCode }: { publicCode: string }) {
  const query = usePublicOrder(publicCode);
  const cancel = useCancelPublicOrder(publicCode);
  const token = useCartStore(
    (state) =>
      Object.entries(state.carts).find(
        ([, cart]) => cart.lastOrderCode === publicCode,
      )?.[0],
  );
  if (query.isPending)
    return (
      <main
        className="mx-auto min-h-dvh max-w-2xl space-y-4 p-4"
        role="status"
        aria-label="A carregar pedido"
      >
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  if (!query.data)
    return (
      <main
        className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 p-6"
        role="alert"
      >
        <h1 className="text-xl font-semibold">
          Não foi possível consultar o pedido
        </h1>
        <p>
          {getApiErrorMessage(
            query.error,
            "Verifica o endereço e tenta novamente.",
          )}
        </p>
        <Button onClick={() => void query.refetch()}>
          <RefreshCw className="size-4" />
          Tentar novamente
        </Button>
      </main>
    );
  const order = query.data;
  const money = new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: order.currency,
  });
  const timeline = [
    ["Recebido", order.createdAt],
    ["Aceite", order.acceptedAt],
    ["Pronto", order.readyAt],
    ["Entregue", order.deliveredAt],
    ["Cancelado", order.cancelledAt],
  ] as const;
  return (
    <main className="mx-auto min-h-dvh max-w-2xl space-y-6 p-4 pb-10 sm:p-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">{order.restaurantName}</p>
        <h1 className="text-2xl font-semibold">Pedido n.º {order.number}</h1>
        <p className="text-sm text-muted-foreground">
          {order.tableLabel} · {order.guestsCount}{" "}
          {order.guestsCount === 1 ? "pessoa" : "pessoas"} ·{" "}
          {order.orderDate.split("-").reverse().join("/")}
        </p>
      </header>
      <section className="space-y-3 rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p role="status" aria-live="polite" className="font-semibold">
            Estado: <Badge>{statusLabels[order.status]}</Badge>
          </p>
          <Button
            variant="outline"
            className="min-h-11"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw className="size-4" />
            Actualizar estado
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {isFinalOrderStatus(order.status)
            ? "Este pedido foi concluído."
            : query.isLive
              ? "Actualizações em tempo real."
              : "A ligar ao tempo real; actualização automática a cada 15 segundos."}
        </p>
        {order.estimatedPrepMinutes !== null &&
          !isFinalOrderStatus(order.status) && (
            <p className="flex items-center gap-2 text-sm">
              <Clock className="size-4" />
              Preparação estimada: {order.estimatedPrepMinutes} minutos
            </p>
          )}
        {order.rejectionReason && (
          <p role="alert" className="text-sm text-destructive">
            Motivo: {order.rejectionReason}
          </p>
        )}
        {query.isError && (
          <p role="alert" className="text-sm text-destructive">
            Não foi possível actualizar. Os dados apresentados são da última
            consulta.
          </p>
        )}
      </section>
      <section className="space-y-3" aria-label="Produtos do pedido">
        <h2 className="text-lg font-semibold">O teu pedido</h2>
        <ul className="divide-y rounded-lg border">
          {order.items.map((item, index) => (
            <li key={index} className="space-y-1 p-4">
              <div className="flex justify-between gap-3">
                <h3 className="font-medium">
                  {item.quantity} × {item.nameSnapshot}
                </h3>
                <p className="whitespace-nowrap font-medium">
                  {money.format(item.lineTotalCents / 100)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Preço unitário: {money.format(item.unitPriceCents / 100)}
              </p>
              {item.note && (
                <p className="whitespace-pre-line text-sm">Nota: {item.note}</p>
              )}
            </li>
          ))}
        </ul>
        {order.customerNote && (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">Nota geral</p>
            <p className="whitespace-pre-line">{order.customerNote}</p>
          </div>
        )}
        <p className="flex justify-between gap-3 rounded-lg bg-muted p-4 text-lg font-semibold">
          <span>Total confirmado</span>
          <span>{money.format(order.totalCents / 100)}</span>
        </p>
      </section>
      <section
        className="space-y-2 text-sm text-muted-foreground"
        aria-label="Histórico do pedido"
      >
        {timeline
          .filter(([, date]) => date)
          .map(([label, date]) => (
            <p key={label}>
              {label}:{" "}
              {new Date(date!).toLocaleString("pt-AO", {
                timeZone: "Africa/Luanda",
              })}
            </p>
          ))}
      </section>
      {order.status === "PENDING" && (
        <ConfirmDialog
          destructive
          title="Cancelar este pedido?"
          description="O pedido será cancelado. Esta acção só é possível enquanto estiver pendente."
          confirmLabel="Sim, cancelar pedido"
          trigger={
            <Button
              variant="destructive"
              className="min-h-11 w-full"
              disabled={cancel.isPending}
            >
              <XCircle className="size-4" />
              Cancelar pedido
            </Button>
          }
          onConfirm={async () => {
            await cancel.mutateAsync();
          }}
        />
      )}
      {token && (
        <a
          className="block min-h-11 py-3 text-center text-primary underline"
          href={`/m/${encodeURIComponent(token)}`}
        >
          Voltar ao menu
        </a>
      )}
    </main>
  );
}
