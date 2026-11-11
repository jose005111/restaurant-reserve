import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRestaurant,
  listRestaurants,
  publicSignup,
  getRestaurantActivity,
  updateRestaurant,
  updateRestaurantStatus,
} from "@/services/restaurants";
import { useAuthStore } from "@/stores/auth-store";
import { UserRole } from "@/types/api";
import type {
  CreateRestaurantInput,
  PublicSignupInput,
  UpdateRestaurantInput,
  UpdateRestaurantStatusInput,
} from "@/types/api";

export const restaurantKeys = {
  all: ["restaurants"] as const,
  activity: (id: string) => ["restaurants", id, "activity"] as const,
};
export const restaurantsQueryKey = restaurantKeys.all;

export function useRestaurants() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: restaurantsQueryKey,
    queryFn: listRestaurants,
    enabled: user?.role === UserRole.SUPER_ADMIN,
  });
}

export function useRestaurantActivity(id: string, enabled: boolean) {
  return useQuery({
    queryKey: restaurantKeys.activity(id),
    queryFn: () => getRestaurantActivity(id),
    enabled,
  });
}

export function useUpdateRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRestaurantInput }) =>
      updateRestaurant(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: restaurantKeys.all });
    },
  });
}

export function useUpdateRestaurantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateRestaurantStatusInput;
    }) => updateRestaurantStatus(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: restaurantKeys.all });
    },
  });
}

export function useCreateRestaurant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRestaurantInput) => createRestaurant(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantsQueryKey });
    },
  });
}

export function usePublicSignup() {
  return useMutation({
    mutationFn: (input: PublicSignupInput) => publicSignup(input),
  });
}
