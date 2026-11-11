import type { components, operations } from "./api.d";

export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  COUNTER: "COUNTER",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ThemeMode = {
  LIGHT: "LIGHT",
  DARK: "DARK",
  SYSTEM: "SYSTEM",
} as const;

export type ThemeMode = (typeof ThemeMode)[keyof typeof ThemeMode];

export const RestaurantStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;

export type RestaurantStatus =
  (typeof RestaurantStatus)[keyof typeof RestaurantStatus];

export const RestaurantPlan = {
  FREE: "FREE",
  BASIC: "BASIC",
  PRO: "PRO",
} as const;

export type RestaurantPlan =
  (typeof RestaurantPlan)[keyof typeof RestaurantPlan];

export const BrandingAsset = {
  LOGO: "logo",
  LOGO_DARK: "logo-dark",
  FAVICON: "favicon",
  BANNER: "banner",
  LOGIN_IMAGE: "login-image",
} as const;

export type BrandingAsset = (typeof BrandingAsset)[keyof typeof BrandingAsset];

export type AuthUser = components["schemas"]["AuthUserDto"];
export type AuthResponse = components["schemas"]["AuthResponseDto"];
export type LoginInput = components["schemas"]["LoginDto"];
export type Restaurant = components["schemas"]["RestaurantResponseDto"];
export type RestaurantActivity =
  components["schemas"]["RestaurantActivityResponseDto"];
export type UpdateRestaurantInput =
  components["schemas"]["UpdateRestaurantDto"];
export type UpdateRestaurantStatusInput =
  components["schemas"]["UpdateRestaurantStatusDto"];
export type CreateRestaurantAdminInput =
  components["schemas"]["CreateRestaurantAdminDto"];
export type CreateRestaurantInput =
  components["schemas"]["CreateRestaurantDto"];
export type PublicSignupInput = components["schemas"]["PublicSignupDto"];
export type DiningTable = components["schemas"]["DiningTableResponseDto"];
export type CreateTableInput = components["schemas"]["CreateDiningTableDto"];
export type UpdateTableInput = components["schemas"]["UpdateDiningTableDto"];
export type TableQr = components["schemas"]["TableQrResponseDto"];
export type GenericLink = components["schemas"]["GenericLinkResponseDto"];
export type StaffUser = components["schemas"]["UserResponseDto"];
export type UserQuery = NonNullable<
  operations["UsersController_findAll"]["parameters"]["query"]
>;
export type CreateUserInput = components["schemas"]["CreateUserDto"];
export type UpdateUserInput = components["schemas"]["UpdateUserDto"];
export type Branding = components["schemas"]["BrandingResponseDto"];
export type UpdateBrandingInput = components["schemas"]["UpdateBrandingDto"];
export type ApiErrorPayload = components["schemas"]["ApiErrorDto"];

export type Category = components["schemas"]["CategoryResponseDto"];
export type CreateCategoryInput = components["schemas"]["CreateCategoryDto"];
export type UpdateCategoryInput = components["schemas"]["UpdateCategoryDto"];
export type MenuItem = components["schemas"]["MenuItemResponseDto"];
export type CreateMenuItemInput = components["schemas"]["CreateMenuItemDto"];
export type UpdateMenuItemInput = components["schemas"]["UpdateMenuItemDto"];
export type MenuItemImage = components["schemas"]["MenuItemImageResponseDto"];
export type PublicMenu = components["schemas"]["PublicMenuResponseDto"];
export type UpdateMenuImageInput = components["schemas"]["UpdateMenuImageDto"];

export type CategoryPage = components["schemas"]["CategoryPageDto"];
export type MenuItemPage = components["schemas"]["MenuItemPageDto"];
export type PaginationMeta = components["schemas"]["PaginationMetaDto"];
export type CategoryQuery = NonNullable<
  operations["CategoriesController_findAll"]["parameters"]["query"]
>;
export type MenuItemQuery = NonNullable<
  operations["MenuItemsController_findAll"]["parameters"]["query"]
>;

export type CreatePublicOrderInput =
  components["schemas"]["CreatePublicOrderDto"];
export type CreatePublicOrderResult =
  components["schemas"]["CreatePublicOrderResponseDto"];
export type PublicOrder = components["schemas"]["PublicOrderResponseDto"];
export type PublicOrderStatus = PublicOrder["status"];
export type StaffOrder = components["schemas"]["StaffOrderResponseDto"];
export type StaffOrderPage = components["schemas"]["StaffOrderPageDto"];
export type StaffOrderQuery = NonNullable<
  operations["StaffOrdersController_list"]["parameters"]["query"]
>;
export type AcceptOrderInput = components["schemas"]["AcceptOrderDto"];
export type RejectOrderInput = components["schemas"]["RejectOrderDto"];
export type ChangeOrderStatusInput =
  components["schemas"]["ChangeOrderStatusDto"];
export type ReportSummary = components["schemas"]["SummaryResponseDto"];
export type ReportQuery = NonNullable<
  operations["ReportsController_summary"]["parameters"]["query"]
>;
