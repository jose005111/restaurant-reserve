export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  COUNTER: 'COUNTER',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const ThemeMode = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
  SYSTEM: 'SYSTEM',
} as const

export type ThemeMode = (typeof ThemeMode)[keyof typeof ThemeMode]

export const RestaurantStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const

export type RestaurantStatus =
  (typeof RestaurantStatus)[keyof typeof RestaurantStatus]

export const RestaurantPlan = {
  FREE: 'FREE',
  BASIC: 'BASIC',
  PRO: 'PRO',
} as const

export type RestaurantPlan =
  (typeof RestaurantPlan)[keyof typeof RestaurantPlan]

export const BrandingAsset = {
  LOGO: 'logo',
  LOGO_DARK: 'logo-dark',
  FAVICON: 'favicon',
  BANNER: 'banner',
  LOGIN_IMAGE: 'login-image',
} as const

export type BrandingAsset =
  (typeof BrandingAsset)[keyof typeof BrandingAsset]

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  restaurantId: string | null
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}

export interface LoginInput {
  email: string
  password: string
}

export interface Restaurant {
  id: string
  name: string
  slug: string
  phone: string | null
  address: string | null
  currency: string
  publicToken: string
  status: RestaurantStatus
  plan: RestaurantPlan
  subscriptionExpiresAt: string | null
  maxTables: number
  maxMenuItems: number
  maxUsers: number
  createdAt: string
  updatedAt: string
}

export interface CreateRestaurantAdminInput {
  name: string
  email: string
  password: string
}

export interface CreateRestaurantInput {
  name: string
  slug?: string
  phone?: string
  address?: string
  currency?: string
  plan?: RestaurantPlan
  admin: CreateRestaurantAdminInput
}

export interface PublicSignupInput {
  name: string
  slug?: string
  phone?: string
  address?: string
  currency?: string
  admin: CreateRestaurantAdminInput
}

export interface DiningTable {
  id: string
  restaurantId: string
  label: string
  qrToken: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTableInput {
  label: string
}

export interface UpdateTableInput {
  label?: string
  isActive?: boolean
}

export interface TableQr {
  tableId: string
  label: string
  url: string
  qrCode: string
}

export interface GenericLink {
  url: string
  qrCode: string
}

export interface StaffUser {
  id: string
  restaurantId: string | null
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserInput {
  restaurantId?: string
  name: string
  email: string
  password: string
  role: UserRole
  isActive?: boolean
}

export interface UpdateUserInput {
  name?: string
  email?: string
  password?: string
  role?: UserRole
  isActive?: boolean
}

export interface Branding {
  logoUrl: string | null
  logoDarkUrl: string | null
  faviconUrl: string | null
  bannerUrl: string | null
  loginImageUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
  themeMode: ThemeMode
  fontFamily: string | null
  borderRadius: number
  welcomeTitle: string | null
  welcomeMessage: string | null
  footerText: string | null
  instagramUrl: string | null
  facebookUrl: string | null
  websiteUrl: string | null
  whatsapp: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateBrandingInput {
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  backgroundColor?: string
  surfaceColor?: string
  textColor?: string
  themeMode?: ThemeMode
  fontFamily?: string | null
  borderRadius?: number
  welcomeTitle?: string | null
  welcomeMessage?: string | null
  footerText?: string | null
  instagramUrl?: string | null
  facebookUrl?: string | null
  websiteUrl?: string | null
  whatsapp?: string | null
}

export interface ApiErrorPayload {
  statusCode: number
  message: string | string[]
  error: string
  timestamp: string
  path: string
}
