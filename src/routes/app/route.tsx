import { CatalogNavigation } from "@/components/menu/catalog-navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import {
  BarChart3,
  FolderOpen,
  Package,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  Store,
  UtensilsCrossed,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useBranding } from "@/hooks/use-branding";
import { applyBranding, resetBranding } from "@/lib/branding";
import { useAuthStore } from "@/stores/auth-store";
import { UserRole } from "@/types/api";

const SIDEBAR_STORAGE_KEY = "restaurant-reserve.sidebar-collapsed";

export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    if (!useAuthStore.getState().token) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

interface NavItem {
  label: string;
  to?:
    | "/app"
    | "/app/onboarding"
    | "/app/restaurants"
    | "/app/tables"
    | "/app/team"
    | "/app/users"
    | "/app/links"
    | "/app/menu"
    | "/app/menu/categories"
    | "/app/menu/products"
    | "/app/orders"
    | "/app/reports";
  icon: typeof LayoutDashboard;
  roles: UserRole[];
  soon?: boolean;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: "Visão geral",
    to: "/app",
    icon: LayoutDashboard,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COUNTER],
  },
  {
    label: "Restaurantes",
    to: "/app/restaurants",
    icon: Building2,
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    label: "Utilizadores",
    to: "/app/users",
    icon: Users,
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    label: "Identidade",
    to: "/app/onboarding",
    icon: Palette,
    roles: [UserRole.ADMIN],
  },
  {
    label: "Pedidos",
    to: "/app/orders",
    icon: ClipboardList,
    roles: [UserRole.ADMIN, UserRole.COUNTER],
  },
  {
    label: "Menu",
    to: "/app/menu",
    icon: UtensilsCrossed,
    roles: [UserRole.ADMIN],
    children: [
      {
        label: "Categorias",
        to: "/app/menu/categories",
        icon: FolderOpen,
        roles: [UserRole.ADMIN],
      },
      {
        label: "Produtos",
        to: "/app/menu/products",
        icon: Package,
        roles: [UserRole.ADMIN],
      },
    ],
  },
  {
    label: "Mesas",
    to: "/app/tables",
    icon: Store,
    roles: [UserRole.ADMIN],
  },
  {
    label: "Equipa",
    to: "/app/team",
    icon: Users,
    roles: [UserRole.ADMIN],
  },
  {
    label: "Links & QR",
    to: "/app/links",
    icon: QrCode,
    roles: [UserRole.ADMIN],
  },
  {
    label: "Relatórios",
    to: "/app/reports",
    icon: BarChart3,
    roles: [UserRole.ADMIN],
  },
];

function AppLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useLocation({ select: (location) => location.pathname });
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const { data: branding } = useBranding();
  const [collapsed, setCollapsed] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true",
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (branding) {
      applyBranding(branding);
    }
  }, [branding]);

  if (!user) {
    return null;
  }

  const items = navItems.filter((item) => item.roles.includes(user.role));

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  const handleLogout = async () => {
    clearSession();
    queryClient.clear();
    resetBranding();
    toast.success("Sessão terminada");
    await navigate({ to: "/login" });
  };

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const roleLabel =
    user.role === UserRole.SUPER_ADMIN
      ? "Administrador da plataforma"
      : user.role === UserRole.ADMIN
        ? "Administrador"
        : "Balcão";

  return (
    <div className="min-h-dvh bg-muted/30 md:flex">
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-background transition-[width] duration-200 md:flex ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div
          className={`flex h-16 items-center border-b ${
            collapsed ? "justify-center px-2" : "gap-2 px-4"
          }`}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <UtensilsCrossed className="size-5" />
          </span>
          {!collapsed ? (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold">
                Restaurant Reserve
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {roleLabel}
              </p>
            </div>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => (
            <NavEntry
              key={item.label}
              item={item}
              active={
                item.to === pathname ||
                (item.to === "/app/menu" && pathname.startsWith("/app/menu/"))
              }
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="border-t p-3">
          <Button
            variant="ghost"
            className={
              collapsed ? "w-full justify-center" : "w-full justify-start"
            }
            onClick={handleLogout}
            title="Terminar sessão"
          >
            <LogOut className="size-4" />
            {!collapsed ? "Terminar sessão" : null}
          </Button>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r bg-background shadow-xl">
            <div className="flex h-16 items-center gap-2 border-b px-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <UtensilsCrossed className="size-5" />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-semibold">
                  Restaurant Reserve
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {roleLabel}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Fechar menu"
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {items.map((item) => (
                <NavEntry
                  key={item.label}
                  item={item}
                  active={item.to === pathname}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </nav>

            <div className="border-t p-3">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                Terminar sessão
              </Button>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Abrir menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              aria-label={
                collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"
              }
              onClick={toggleCollapsed}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-5" />
              ) : (
                <PanelLeftClose className="size-5" />
              )}
            </Button>
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground md:hidden">
              <UtensilsCrossed className="size-5" />
            </span>
            <p className="truncate text-sm text-muted-foreground">
              {roleLabel}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="size-9">
                    <AvatarFallback>{initials || "RR"}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="size-4" />
                  Terminar sessão
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavEntry({
  item,
  active,
  collapsed = false,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const baseClass =
    "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors";
  const layoutClass = collapsed ? "justify-center px-2" : "px-3";
  const inactiveClass =
    "text-muted-foreground hover:bg-muted hover:text-foreground";

  if (!item.to || item.soon) {
    return (
      <span
        className={`${baseClass} ${layoutClass} cursor-not-allowed opacity-60`}
        title={item.soon ? `${item.label} (em breve)` : item.label}
      >
        <Icon className="size-4 shrink-0" />
        {!collapsed ? (
          <>
            {item.label}
            {item.soon ? (
              <Badge variant="secondary" className="ml-auto text-[10px]">
                Em breve
              </Badge>
            ) : null}
          </>
        ) : null}
      </span>
    );
  }

  return (
    <>
      <Link
        to={item.to}
        title={item.label}
        onClick={onNavigate}
        className={`${baseClass} ${layoutClass} ${
          active ? "bg-primary/10 text-primary" : inactiveClass
        }`}
      >
        <Icon className="size-4 shrink-0" />
        {!collapsed ? item.label : null}
      </Link>
      {item.children && (
        <CatalogNavigation collapsed={collapsed} onNavigate={onNavigate} />
      )}
    </>
  );
}
