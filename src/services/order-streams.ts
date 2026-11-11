import { fetchEventSource } from "@microsoft/fetch-event-source";
import { env } from "@/lib/env";

interface StreamCallbacks {
  onConnected: () => void;
  onChanged: () => void;
  onDisconnected: () => void;
}

export async function subscribeStaffOrders(
  token: string,
  signal: AbortSignal,
  callbacks: StreamCallbacks & { onUnauthorized: () => void },
) {
  await fetchEventSource(`${env.apiUrl}/orders/stream`, {
    signal,
    headers: { Authorization: `Bearer ${token}` },
    async onopen(response) {
      if (response.status === 401) {
        callbacks.onUnauthorized();
        throw new Error("Sessão expirada");
      }
      if (
        !response.ok ||
        !response.headers.get("content-type")?.includes("text/event-stream")
      )
        throw new Error("Não foi possível ligar ao balcão");
    },
    onmessage(message) {
      if (message.event === "connected") callbacks.onConnected();
      if (
        message.event === "order.created" ||
        message.event === "order.status_changed"
      )
        callbacks.onChanged();
    },
    onclose() {
      callbacks.onDisconnected();
      throw new Error("Ligação SSE terminada");
    },
    onerror() {
      callbacks.onDisconnected();
      return 5000;
    },
  });
}

export function subscribePublicOrder(
  code: string,
  callbacks: StreamCallbacks,
): () => void {
  const source = new EventSource(
    `${env.apiUrl}/public/orders/${encodeURIComponent(code)}/stream`,
  );
  source.onopen = callbacks.onConnected;
  source.onerror = callbacks.onDisconnected;
  source.addEventListener("connected", callbacks.onChanged);
  source.addEventListener("order.status_changed", callbacks.onChanged);
  return () => source.close();
}
