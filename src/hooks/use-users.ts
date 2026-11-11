import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from "@/services/users";
import { useAuthStore } from "@/stores/auth-store";
import { UserRole } from "@/types/api";
import type { CreateUserInput, UpdateUserInput, UserQuery } from "@/types/api";

export const usersQueryKey = ["users"] as const;

export function useUsers(query: UserQuery = {}) {
  const user = useAuthStore((state) => state.user);
  const enabled =
    user?.role === UserRole.SUPER_ADMIN ||
    (user?.role === UserRole.ADMIN && Boolean(user.restaurantId));

  return useQuery({
    queryKey: [...usersQueryKey, user?.id, query],
    queryFn: () => listUsers(query),
    enabled,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      updateUser(id, input),
    onSuccess: (updated) => {
      const session = useAuthStore.getState();
      if (session.user?.id === updated.id && session.token) {
        session.setSession({
          accessToken: session.token,
          user: {
            ...session.user,
            name: updated.name,
            email: updated.email,
            role: updated.role,
          },
        });
      }
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
  });
}
