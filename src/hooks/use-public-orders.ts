import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  createPublicOrder,
  getPublicOrder,
  cancelPublicOrder,
} from "@/services/public-orders";
import { menuKeys } from "@/hooks/use-menu";
import { useCartStore } from "@/stores/cart-store";
import { getApiErrorMessage } from "@/lib/api";
import type {
  PublicMenu,
  PublicOrderStatus,
  CreatePublicOrderInput,
} from "@/types/api";
import { subscribePublicOrder } from "@/services/order-streams";
export const publicOrderKeys = {
  detail: (code: string) => ["public-orders", code] as const,
};
export const isFinalOrderStatus = (status: PublicOrderStatus) =>
  ["DELIVERED", "REJECTED", "CANCELLED"].includes(status);
export function usePublicOrder(code: string) {
  const client = useQueryClient();
  const [isLive, setLive] = useState(false);
  const query = useQuery({
    queryKey: publicOrderKeys.detail(code),
    queryFn: () => getPublicOrder(code),
    retry: false,
    refetchInterval: (query) =>
      isLive ||
      (query.state.data && isFinalOrderStatus(query.state.data.status))
        ? false
        : 15000,
  });
  const active = Boolean(query.data && !isFinalOrderStatus(query.data.status));
  useEffect(() => {
    if (!active || typeof EventSource === "undefined") return;
    const unsubscribe = subscribePublicOrder(code, {
      onConnected: () => setLive(true),
      onChanged: () => {
        void client.invalidateQueries({
          queryKey: publicOrderKeys.detail(code),
        });
      },
      onDisconnected: () => setLive(false),
    });
    return () => {
      unsubscribe();
      setLive(false);
    };
  }, [active, client, code]);
  return { ...query, isLive };
}
export function useSubmitPublicOrder(token: string) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: CreatePublicOrderInput) => createPublicOrder(input),
    retry: false,
  });
  const busy = useCartStore((state) => Boolean(state.inFlight[token]));
  const submit = async (menu: PublicMenu) => {
    const store = useCartStore.getState();
    if (!store.claim(token)) return null;
    let key: string | undefined;
    try {
      const request = store.prepare(token, menu);
      key = request.idempotencyKey;
      const result = await mutation.mutateAsync(request);
      store.complete(token, key, result.publicCode);
      toast.success("Pedido enviado", {
        description: `Pedido n.º ${result.number}`,
      });
      return result;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400)
        void client.invalidateQueries({ queryKey: menuKeys.public(token) });
      if (key) {
        const status = axios.isAxiosError(error)
          ? error.response?.status
          : undefined;
        store.failed(
          token,
          key,
          Boolean(status && status >= 400 && status < 500 && status !== 408),
        );
      }
      toast.error(
        error instanceof Error && !axios.isAxiosError(error)
          ? error.message
          : getApiErrorMessage(error, "Não foi possível enviar o pedido"),
      );
      return null;
    } finally {
      store.release(token);
    }
  };
  return { submit, isPending: busy, error: mutation.error };
}
export function useCancelPublicOrder(code: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => cancelPublicOrder(code),
    retry: false,
    onSuccess: (order) => {
      client.setQueryData(publicOrderKeys.detail(code), order);
      toast.success("Pedido cancelado");
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Não foi possível cancelar o pedido"),
      );
      void client.invalidateQueries({ queryKey: publicOrderKeys.detail(code) });
    },
  });
}
