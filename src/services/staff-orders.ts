import { api } from "@/lib/api";
import type {
  AcceptOrderInput,
  ChangeOrderStatusInput,
  RejectOrderInput,
  StaffOrder,
  StaffOrderPage,
  StaffOrderQuery,
} from "@/types/api";

export async function listOrders(
  params: StaffOrderQuery,
  signal?: AbortSignal,
) {
  return (await api.get<StaffOrderPage>("/orders", { params, signal })).data;
}
export async function getOrder(id: string) {
  return (await api.get<StaffOrder>(`/orders/${id}`)).data;
}
export async function acceptOrder({
  id,
  input,
}: {
  id: string;
  input: AcceptOrderInput;
}) {
  return (await api.patch<StaffOrder>(`/orders/${id}/accept`, input)).data;
}
export async function rejectOrder({
  id,
  input,
}: {
  id: string;
  input: RejectOrderInput;
}) {
  return (await api.patch<StaffOrder>(`/orders/${id}/reject`, input)).data;
}
export async function changeOrderStatus({
  id,
  input,
}: {
  id: string;
  input: ChangeOrderStatusInput;
}) {
  return (await api.patch<StaffOrder>(`/orders/${id}/status`, input)).data;
}
