import { api } from '@/lib/api'
import type {
  CreateRestaurantInput,
  PublicSignupInput,
  Restaurant,
} from '@/types/api'

export async function createRestaurant(
  input: CreateRestaurantInput,
): Promise<Restaurant> {
  const { data } = await api.post<Restaurant>('/restaurants', input)
  return data
}

export async function publicSignup(
  input: PublicSignupInput,
): Promise<Restaurant> {
  const { data } = await api.post<Restaurant>('/public/signup', input)
  return data
}

export async function listRestaurants(): Promise<Restaurant[]> {
  const { data } = await api.get<Restaurant[]>('/restaurants')
  return data
}
