import { api } from '@/lib/api'
import type {
  CreateTableInput,
  DiningTable,
  TableQr,
  UpdateTableInput,
} from '@/types/api'

export async function listTables(): Promise<DiningTable[]> {
  const { data } = await api.get<DiningTable[]>('/tables')
  return data
}

export async function createTable(
  input: CreateTableInput,
): Promise<DiningTable> {
  const { data } = await api.post<DiningTable>('/tables', input)
  return data
}

export async function updateTable(
  id: string,
  input: UpdateTableInput,
): Promise<DiningTable> {
  const { data } = await api.patch<DiningTable>(`/tables/${id}`, input)
  return data
}

export async function deleteTable(id: string): Promise<void> {
  await api.delete(`/tables/${id}`)
}

export async function getTableQr(id: string): Promise<TableQr> {
  const { data } = await api.get<TableQr>(`/tables/${id}/qr`)
  return data
}

export async function rotateTableToken(id: string): Promise<DiningTable> {
  const { data } = await api.post<DiningTable>(`/tables/${id}/qr/rotate`)
  return data
}
