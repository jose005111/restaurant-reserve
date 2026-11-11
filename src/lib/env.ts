export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  publicMenuUrl:
    import.meta.env.VITE_PUBLIC_MENU_URL ?? 'http://localhost:5173/m',
  allowPublicSignup:
    import.meta.env.VITE_ALLOW_PUBLIC_SIGNUP === 'true',
}
