# Guia de bibliotecas — Frontend `restaurant-reserve`

Frontend React (SPA) do SaaS de pedidos por QR code. Consome a API NestJS descrita em `prompt-api-pedidos-restaurante-saas-nestjs.md`.

> **Versões:** este guia não fixa números de versão. Instala sempre a versão actual (`npm install <pkg>`) e, ao configurar, confirma na documentação oficial de cada lib, porque o ecossistema muda depressa.

---

## 1. Stack em resumo

| Camada              | Escolha                                                                       | Obrigatória?                   |
| ------------------- | ----------------------------------------------------------------------------- | ------------------------------ |
| Build               | Vite + React + TypeScript (`strict`)                                          | Sim                            |
| Rotas               | TanStack Router                                                               | Sim                            |
| Dados do servidor   | TanStack Query                                                                | Sim                            |
| Estilos             | Tailwind CSS v4                                                               | Sim                            |
| Componentes         | shadcn/ui (Radix)                                                             | Sim                            |
| Ícones              | lucide-react                                                                  | Sim                            |
| Formulários         | React Hook Form + Zod + `@hookform/resolvers`                                 | Sim                            |
| HTTP                | axios                                                                         | Recomendada                    |
| Tempo real (balcão) | `@microsoft/fetch-event-source`                                               | Sim (SSE com JWT)              |
| Estado do cliente   | zustand (carrinho do cliente)                                                 | Recomendada                    |
| Tabelas             | `@tanstack/react-table`                                                       | Recomendada (lista de pedidos) |
| Datas               | date-fns                                                                      | Recomendada                    |
| Notificações        | sonner (via shadcn)                                                           | Recomendada                    |
| Tipos da API        | `openapi-typescript`                                                          | Recomendada                    |
| Extras de UX        | `react-colorful`, `react-dropzone`, `browser-image-compression`, `@dnd-kit/*` | Opcionais                      |
| Gráficos            | recharts (via shadcn `chart`)                                                 | Opcional (relatórios)          |
| PWA                 | `vite-plugin-pwa`                                                             | Opcional (fase final)          |
| Qualidade           | Prettier + plugin Tailwind, ESLint TanStack, Vitest, Testing Library, MSW     | Recomendadas                   |

---

## 2. Criar o projecto

Se já geraste o projecto com a variante **TanStack Router** do `create-vite`, confirma o que veio instalado (`package.json`) e salta os passos que já estiverem feitos. Caso contrário:

```bash
npm create vite@latest restaurant-reserve -- --template react-ts
cd restaurant-reserve
npm install
```

---

## 3. Instalação por grupos

### 3.1 Tailwind CSS v4 + aliases

```bash
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node
```

`src/index.css` (substitui o conteúdo):

```css
@import "tailwindcss";
```

`tsconfig.json` **e** `tsconfig.app.json` (o shadcn precisa do alias antes do `init`):

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### 3.2 TanStack Router

```bash
npm install @tanstack/react-router
npm install -D @tanstack/router-plugin @tanstack/react-router-devtools
```

### 3.3 `vite.config.ts`

O plugin do router tem de vir **antes** do plugin do React.

```ts
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

### 3.4 TanStack Query

```bash
npm install @tanstack/react-query
npm install -D @tanstack/react-query-devtools
```

### 3.5 shadcn/ui + lucide

```bash
npx shadcn@latest init
npm install lucide-react
```

Responde às perguntas do CLI (cor base _Neutral_, variáveis CSS _Yes_). O `init` cria o `components.json`, o `src/lib/utils.ts` (`cn()`) e instala as dependências de apoio (`clsx`, `tailwind-merge`, `class-variance-authority`, `tw-animate-css`).

Componentes a adicionar desde já (cobrem o menu público e o painel):

```bash
npx shadcn@latest add button card input label textarea select checkbox switch badge \
  tabs dialog alert-dialog sheet drawer dropdown-menu popover tooltip avatar separator \
  skeleton table sonner sidebar calendar chart
```

- `drawer` → carrinho do cliente em ecrãs pequenos (bottom sheet).
- `sidebar` → layout do painel do staff.
- `sonner` → toasts (pedido enviado, erros).
- `chart` → relatórios (traz o recharts).

### 3.6 Formulários e validação

```bash
npm install react-hook-form zod @hookform/resolvers
```

Confirma que a versão do `@hookform/resolvers` suporta a versão do Zod instalada.

### 3.7 HTTP e tempo real

```bash
npm install axios @microsoft/fetch-event-source
```

- **axios**: interceptors para JWT, tratamento central de erros (401/403/409), e progresso de upload nas imagens.
- **SSE do balcão** (`GET /orders/stream`): o `EventSource` nativo **não envia o header `Authorization`**, por isso usa `fetch-event-source`.
- **SSE do cliente** (`/public/orders/:publicCode/stream`): não leva JWT, serve o `EventSource` nativo.

### 3.8 Estado do cliente, tabelas e datas

```bash
npm install zustand @tanstack/react-table date-fns
```

- **zustand** com middleware `persist`: carrinho do cliente, chave por `token` (para não misturar carrinhos de restaurantes diferentes).
- **react-table**: lista de pedidos, pratos e utilizadores (padrão "data table" do shadcn).
- **date-fns** com locale `pt`: horas dos pedidos. Para o fuso de Luanda usa `Intl.DateTimeFormat` com `timeZone: "Africa/Luanda"`.

### 3.9 Extras que melhoram a experiência (opcionais)

```bash
npm install react-colorful react-dropzone browser-image-compression
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

| Lib                         | Onde usar                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `react-colorful`            | Selector de cores na página de branding                                                                     |
| `react-dropzone`            | Upload de logo, banner e imagens de pratos                                                                  |
| `browser-image-compression` | Reduzir fotos do telemóvel **antes** do upload (o redimensionamento no servidor está fora do âmbito da API) |
| `@dnd-kit/*`                | Reordenar imagens do prato (`reorder`) e categorias                                                         |

### 3.10 Tipos gerados a partir da API

```bash
npm install -D openapi-typescript
```

Gera os tipos a partir do Swagger do Nest (contrato versionado em `../restaurant-reserve-api/docs/openapi.json`; em execução, JSON em `/api/docs-json` e Swagger em `/api/docs`):

```bash
npx openapi-typescript ../restaurant-reserve-api/docs/openapi.json -o src/types/api.d.ts --default-non-nullable false
```

Adiciona o script no `package.json`:

```json
"scripts": { "gen:api": "openapi-typescript ../restaurant-reserve-api/docs/openapi.json -o src/types/api.d.ts --default-non-nullable false" }
```

A opção `--default-non-nullable false` preserva os campos opcionais do contrato mesmo quando têm valores por omissão. Assim os tipos dos DTOs vêm sempre da API. Os services e hooks continuam escritos à mão (Service → Hook → Component).

### 3.11 Qualidade

```bash
npm install -D prettier prettier-plugin-tailwindcss @tanstack/eslint-plugin-query
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom msw
```

- `prettier-plugin-tailwindcss` ordena as classes automaticamente.
- `@tanstack/eslint-plugin-query` apanha erros comuns (query keys, dependências).
- **MSW** simula a API nos testes e permite desenvolver o frontend antes de o backend estar pronto.

### 3.12 PWA (opcional, fase final)

```bash
npm install -D vite-plugin-pwa
```

Útil para o balcão (instalar como app no tablet) e para o menu do cliente. Atenção: o manifest é estático, por isso o nome e o ícone não variam por restaurante. Deixa para depois do MVP.

---

## 4. Ligação base: `main.tsx`

```tsx
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

const router = createRouter({ routeTree, context: { queryClient } });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
```

`src/routes/__root.tsx` deve usar `createRootRouteWithContext<{ queryClient: QueryClient }>()` para os `loader`s poderem chamar `queryClient.ensureQueryData(...)`.

---

## 5. Estrutura de pastas (Service → Hook → Component)

```
src/
  routes/                      # TanStack Router (ficheiros = rotas)
    __root.tsx
    m.$token.tsx               # menu público (link por mesa ou genérico)
    m.$token.pedido.$code.tsx  # acompanhar pedido
    r.$slug.login.tsx          # login do staff com branding do restaurante
    app/                       # layout protegido (beforeLoad: auth + role)
      route.tsx
      orders.tsx               # balcão (SSE)
      menu.tsx
      tables.tsx
      branding.tsx
      users.tsx
      reports.tsx
  services/                    # chamadas HTTP (axios) — sem React
  hooks/                       # useQuery/useMutation que usam os services
  components/
    ui/                        # shadcn (gerado)
    public/                    # menu, carrinho, estado do pedido
    staff/                     # fila do balcão, formulários, tabelas
    branding/                  # BrandingProvider, selectores
  stores/                      # zustand (carrinho)
  lib/                         # utils.ts, api client, formatadores, branding.ts
  schemas/                     # Zod
  types/                       # api.d.ts (gerado)
```

Árvores de rotas: `/m/$token` (cliente), `/r/$slug/login` (login), `/app/*` (staff, protegido por `beforeLoad` + role).

---

## 6. Branding por restaurante em runtime

O shadcn/ui usa variáveis CSS (`--primary`, `--background`, `--radius`...). Basta mapear o `branding` devolvido pela API para essas variáveis, sem rebuild:

```ts
// src/lib/branding.ts
export interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  themeMode: "LIGHT" | "DARK" | "SYSTEM";
  borderRadius: number;
}

// Escolhe texto claro ou escuro conforme a luminância do fundo
function readableOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111827" : "#FFFFFF";
}

export function applyBranding(b: Branding) {
  const s = document.documentElement.style;
  s.setProperty("--background", b.backgroundColor);
  s.setProperty("--foreground", b.textColor);
  s.setProperty("--card", b.surfaceColor);
  s.setProperty("--card-foreground", b.textColor);
  s.setProperty("--primary", b.primaryColor);
  s.setProperty("--primary-foreground", readableOn(b.primaryColor));
  s.setProperty("--secondary", b.secondaryColor);
  s.setProperty("--secondary-foreground", readableOn(b.secondaryColor));
  s.setProperty("--accent", b.accentColor);
  s.setProperty("--accent-foreground", readableOn(b.accentColor));
  s.setProperty("--radius", `${b.borderRadius / 16}rem`);

  const dark =
    b.themeMode === "DARK" ||
    (b.themeMode === "SYSTEM" &&
      matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}
```

Notas:

- O `readableOn` é essencial: o restaurante escolhe a cor, mas o texto sobre ela tem de ser legível. Sem isto, uma cor clara dá botões com texto invisível.
- A API guarda **uma só paleta** por restaurante. O `themeMode` só alterna os tokens neutros do shadcn (`muted`, `border`...). Quem escolher `DARK` deve escolher também cores de fundo e texto adequadas.
- Aplica o branding num `BrandingProvider` assim que o menu (`/public/menu/:token`) ou o login (`/public/branding/:slug`) responder, e define `document.title` e o favicon a partir dele.

---

## 7. Responsividade e UX actual

- **Mobile-first no menu do cliente.** Escreve as classes base para telemóvel e sobe com `sm:`, `md:`, `lg:`. O cliente usa o telemóvel de pé, com uma mão.
- **Painel do staff pensado para tablet e desktop.** `sidebar` do shadcn que colapsa em ecrãs pequenos; fila de pedidos em colunas por estado (Pendente / A preparar / Pronto) no desktop e em abas (`tabs`) no telemóvel.
- **Carrinho em `drawer`** (bottom sheet) no telemóvel e `sheet` lateral no desktop.
- **Alvos de toque ≥ 44 px**, botão de "Enviar pedido" fixo no fundo do ecrã com `padding-bottom: env(safe-area-inset-bottom)`.
- **`100dvh` em vez de `100vh`** em layouts de ecrã inteiro (a barra do browser móvel não corta o conteúdo).
- **Skeletons** em vez de spinners enquanto o menu carrega.
- **Imagens**: `loading="lazy"`, `aspect-ratio` fixo (sem saltos de layout) e a imagem principal do prato primeiro.
- **Mutações com feedback imediato:** `useMutation` + `sonner`; no balcão, actualização optimista ao aceitar/mudar estado e `invalidateQueries` quando o SSE trouxer o evento real.
- **Acessibilidade:** os componentes Radix do shadcn já tratam foco e teclado. Garante `alt` nas imagens (a API guarda `altText`) e contraste das cores do branding.

---

## 8. Variáveis de ambiente

`.env.local`:

```
VITE_API_URL=http://localhost:3000
```

Só as variáveis com prefixo `VITE_` ficam acessíveis no browser. Nunca coloques segredos aqui.

---

## 9. Ordem de execução sugerida

1. Criar projecto, Tailwind v4, aliases (3.1).
2. TanStack Router + `vite.config.ts` (3.2, 3.3).
3. TanStack Query + `main.tsx` (3.4, secção 4).
4. shadcn `init` + componentes (3.5).
5. Formulários, HTTP, SSE, zustand, tabelas (3.6 a 3.8).
6. Gerar tipos da API (3.10), depois de receberes o Swagger.
7. Extras e qualidade (3.9, 3.11) à medida que cada ecrã o exigir.

---

## 10. Para avançar: o que preciso da API

Para gerar services, hooks e schemas fiéis ao backend, envia:

- O **JSON do Swagger** (`/api/docs-json`) ou a lista de endpoints com os DTOs de entrada e saída. http://localhost:3000/api/docs
- A **URL base** http://localhost:3000/api
- O formato do **login** (resposta do `/auth/login`, expiração do token, se há refresh token).
- Os **nomes dos campos** (camelCase ou snake_case) devolvidos pela API.

---

## Fontes

- shadcn/ui com Vite: https://ui.shadcn.com/docs/installation/vite
- Tailwind CSS v4 com Vite: https://tailwindcss.com/docs/installation/using-vite
- TanStack Router: https://tanstack.com/router
- TanStack Query: https://tanstack.com/query
