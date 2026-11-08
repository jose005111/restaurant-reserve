import { api } from '@/lib/api'
import type {
  CreateUserInput,
  StaffUser,
  UpdateUserInput,
} from '@/types/api'

export async function listUsers(): Promise<StaffUser[]> {
  const { data } = await api.get<StaffUser[]>('/users')
  return data
}

export async function createUser(input: CreateUserInput): Promise<StaffUser> {
  const { data } = await api.post<StaffUser>('/users', input)
  return data
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<StaffUser> {
  const { data } = await api.patch<StaffUser>(`/users/${id}`, input)
  return data
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`)
}
