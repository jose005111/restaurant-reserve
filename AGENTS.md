# restaurant-reserve (React)

Frontend SPA do SaaS de pedidos por QR code. Referência: `docs/plano.md`.

## Stack

Vite + React + TypeScript `strict`, TanStack Router (rotas por ficheiros), TanStack Query,
Tailwind v4, shadcn/ui, lucide-react, React Hook Form + Zod, axios, zustand (carrinho),
`@microsoft/fetch-event-source` (SSE do balcão).

## Arquitectura: Service → Hook → Component

- `src/services/`: chamadas HTTP (axios), sem React
- `src/hooks/`: `useQuery` / `useMutation` que usam os services
- `src/components/`: apenas UI; sem chamadas HTTP directas
- `src/schemas/`: Zod. `src/stores/`: zustand. `src/lib/`: utilitários.

## Regras que nunca se quebram

- Tipos da API vêm de `src/types/api.d.ts` (gerado por `npm run gen:api`). Nunca editar à mão.
- Nunca editar `src/routeTree.gen.ts` (gerado).
- Query keys centralizadas numa factory por domínio.
- Cores e raio só por tokens do shadcn (`bg-primary`, `text-foreground`, `rounded-lg`...), nunca hex fixo: cada restaurante define o seu branding em runtime via CSS variables.
- Mobile-first no menu do cliente (`/m/$token`); painel do staff (`/app/*`) pensado para tablet e desktop.
- SSE do balcão com `fetch-event-source` (precisa do header Authorization); SSE do cliente com `EventSource` nativo.
- Erros e sucessos de mutações via `sonner`; formulários com React Hook Form + Zod.
- Textos visíveis ao utilizador em português. Acessibilidade: `alt` nas imagens, foco visível, contraste.

## Comandos

`npm run dev`, `npm run build`, `npm run lint`, `npm run gen:api`.
