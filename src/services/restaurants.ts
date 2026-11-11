import { api } from "@/lib/api";
import type {
  CreateRestaurantInput,
  PublicSignupInput,
  Restaurant,
  RestaurantActivity,
  UpdateRestaurantInput,
  UpdateRestaurantStatusInput,
} from "@/types/api";

export async function createRestaurant(
  input: CreateRestaurantInput,
): Promise<Restaurant> {
  const { data } = await api.post<Restaurant>("/restaurants", input);
  return data;
}

export async function publicSignup(
  input: PublicSignupInput,
): Promise<Restaurant> {
  const { data } = await api.post<Restaurant>("/public/signup", input);
  return data;
}

export async function listRestaurants(): Promise<Restaurant[]> {
  const { data } = await api.get<Restaurant[]>("/restaurants");
  return data;
}

export async function getRestaurantActivity(
  id: string,
): Promise<RestaurantActivity> {
  const { data } = await api.get<RestaurantActivity>(
    `/restaurants/${id}/activity`,
  );
  return data;
}

export async function updateRestaurant(
  id: string,
  input: UpdateRestaurantInput,
): Promise<Restaurant> {
  const { data } = await api.patch<Restaurant>(`/restaurants/${id}`, input);
  return data;
}

export async function updateRestaurantStatus(
  id: string,
  input: UpdateRestaurantStatusInput,
): Promise<Restaurant> {
  const { data } = await api.patch<Restaurant>(
    `/restaurants/${id}/status`,
    input,
  );
  return data;
}
