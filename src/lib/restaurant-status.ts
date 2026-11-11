import { RestaurantStatus, type Restaurant } from "@/types/api";

export function getRestaurantAvailability(
  restaurant: Restaurant,
): "active" | "suspended" | "expired" {
  if (restaurant.status === RestaurantStatus.SUSPENDED) return "suspended";
  if (
    restaurant.subscriptionExpiresAt &&
    new Date(restaurant.subscriptionExpiresAt).getTime() <= Date.now()
  )
    return "expired";
  return "active";
}
