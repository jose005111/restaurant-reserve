import { api } from "@/lib/api";
import type {
  CreateUserInput,
  StaffUser,
  UpdateUserInput,
  UserQuery,
} from "@/types/api";

export async function listUsers(query: UserQuery = {}): Promise<StaffUser[]> {
  const { data } = await api.get<StaffUser[]>("/users", { params: query });
  return data;
}

export async function createUser(input: CreateUserInput): Promise<StaffUser> {
  const { data } = await api.post<StaffUser>("/users", input);
  return data;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<StaffUser> {
  const { data } = await api.patch<StaffUser>(`/users/${id}`, input);
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}
