import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api";
import * as orders from "@/services/staff-orders";
import { useAuthStore } from "@/stores/auth-store";
import { UserRole } from "@/types/api";
import type { StaffOrderQuery } from "@/types/api";
import { subscribeStaffOrders } from "@/services/order-streams";

export const staffOrderKeys = {
  all: (tenant: string | null) => ["staff-orders", tenant] as const,
  list: (tenant: string | null, query: StaffOrderQuery) =>
    [...staffOrderKeys.all(tenant), "list", query] as const,
  detail: (tenant: string | null, id: string) =>
    [...staffOrderKeys.all(tenant), "detail", id] as const,
};

export function useStaffOrders(query: StaffOrderQuery) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const tenant = user?.restaurantId ?? null;
  const client = useQueryClient();
  const [isLive, setLive] = useState(false);
  useEffect(() => {
    if (
      !token ||
      !tenant ||
      (user?.role !== UserRole.ADMIN && user?.role !== UserRole.COUNTER)
    )
      return;
    const controller = new AbortController();
    void subscribeStaffOrders(token, controller.signal, {
      onConnected: () => {
        setLive(true);
        void client.invalidateQueries({ queryKey: staffOrderKeys.all(tenant) });
      },
      onChanged: () => {
        void client.invalidateQueries({ queryKey: staffOrderKeys.all(tenant) });
      },
      onDisconnected: () => setLive(false),
      onUnauthorized: () => {
        useAuthStore.getState().clearSession();
        window.location.assign("/login");
      },
    }).catch(() => setLive(false));
    return () => {
      controller.abort();
      setLive(false);
    };
  }, [client, tenant, token, user?.role]);
  return useQuery({
    queryKey: staffOrderKeys.list(tenant, query),
    queryFn: ({ signal }) => orders.listOrders(query, signal),
    enabled:
      Boolean(tenant) &&
      (user?.role === UserRole.ADMIN || user?.role === UserRole.COUNTER),
    refetchInterval: isLive ? false : 15_000,
  });
}

function useOrderMutation<T>(
  mutationFn: (input: T) => ReturnType<typeof orders.acceptOrder>,
) {
  const client = useQueryClient();
  const tenant = useAuthStore((state) => state.user?.restaurantId ?? null);
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: staffOrderKeys.all(tenant) });
      toast.success("Pedido actualizado");
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(error, "Não foi possível actualizar o pedido"),
      ),
  });
}
export function useAcceptOrder() {
  return useOrderMutation(orders.acceptOrder);
}
export function useRejectOrder() {
  return useOrderMutation(orders.rejectOrder);
}
export function useChangeOrderStatus() {
  return useOrderMutation(orders.changeOrderStatus);
}
