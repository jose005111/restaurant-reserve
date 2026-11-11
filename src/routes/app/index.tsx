import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Palette,
  QrCode,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateRestaurantDialog } from "@/components/restaurants/create-restaurant-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { brandingQueryKey, useBranding } from "@/hooks/use-branding";
import { useRestaurants } from "@/hooks/use-restaurants";
import { isOnboardingComplete } from "@/lib/branding";
import { getRestaurantAvailability } from "@/lib/restaurant-status";
import { getBranding } from "@/services/branding";
import { useAuthStore } from "@/stores/auth-store";
import { UserRole } from "@/types/api";

export const Route = createFileRoute("/app/")({
  loader: async ({ context }) => {
    const user = useAuthStore.getState().user;

    if (!user || user.role === UserRole.SUPER_ADMIN || !user.restaurantId) {
      return;
    }

    const branding = await context.queryClient.ensureQueryData({
      queryKey: brandingQueryKey,
      queryFn: getBranding,
    });

    if (user.role === UserRole.ADMIN && !isOnboardingComplete(branding)) {
      throw redirect({ to: "/app/onboarding" });
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  if (user.role === UserRole.SUPER_ADMIN) {
    return <PlatformDashboard />;
  }

  return <RestaurantDashboard />;
}

function PlatformDashboard() {
  const { data: restaurants = [], isLoading } = useRestaurants();
  const active = restaurants.filter(
    (restaurant) => getRestaurantAvailability(restaurant) === "active",
  ).length;
  const suspended = restaurants.filter(
    (restaurant) => getRestaurantAvailability(restaurant) === "suspended",
  ).length;
  const expired = restaurants.length - active - suspended;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Visão geral da plataforma
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanha os restaurantes registados e o estado das subscrições.
          </p>
        </div>
        <CreateRestaurantDialog
          trigger={
            <Button>
              <Building2 className="size-4" />
              Registar restaurante
            </Button>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Restaurantes"
          value={restaurants.length}
          icon={<Store className="size-4" />}
        />
        <StatCard
          label="Activos"
          value={active}
          icon={<CheckCircle2 className="size-4" />}
        />
        <StatCard
          label="Suspensos"
          value={suspended}
          icon={<Clock className="size-4" />}
        />
        <StatCard
          label="Expirados"
          value={expired}
          icon={<Clock className="size-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Restaurantes recentes</CardTitle>
          <CardDescription>
            Os últimos tenants criados na plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">A carregar...</p>
          ) : restaurants.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Sparkles className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Ainda não há restaurantes registados.
              </p>
              <CreateRestaurantDialog
                trigger={
                  <Button variant="outline" size="sm">
                    Registar o primeiro restaurante
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurante</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Criado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restaurants.slice(0, 5).map((restaurant) => (
                  <TableRow key={restaurant.id}>
                    <TableCell>
                      <div className="font-medium">{restaurant.name}</div>
                      <div className="text-xs text-muted-foreground">
                        /{restaurant.slug}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{restaurant.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          getRestaurantAvailability(restaurant) === "active"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {getRestaurantAvailability(restaurant) === "active"
                          ? "Activo"
                          : getRestaurantAvailability(restaurant) === "expired"
                            ? "Expirado"
                            : "Suspenso"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(restaurant.createdAt), "dd MMM yyyy", {
                        locale: pt,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RestaurantDashboard() {
  const user = useAuthStore((state) => state.user);
  const { data: branding } = useBranding();

  if (!user) {
    return null;
  }

  const onboardingComplete = branding ? isOnboardingComplete(branding) : false;
  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Olá, {user.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          {branding?.welcomeTitle ?? "Bem-vindo ao painel do teu restaurante."}
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary to-accent" />
        <CardContent className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-background shadow-sm">
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Logótipo do restaurante"
                className="size-full object-cover"
              />
            ) : (
              <Palette className="size-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 space-y-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold">
                {branding?.welcomeTitle ?? "Identidade por configurar"}
              </p>
              <Badge variant={onboardingComplete ? "default" : "secondary"}>
                {onboardingComplete
                  ? "Onboarding concluído"
                  : "Onboarding pendente"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {branding?.welcomeMessage ??
                "Personaliza a marca para os teus clientes."}
            </p>
          </div>
          {isAdmin ? (
            <Button asChild variant="outline">
              <Link to="/app/onboarding">
                <Palette className="size-4" />
                Editar identidade
              </Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isAdmin ? (
          <>
            <QuickAction
              title="Identidade visual"
              description="Cores, logo e mensagem de boas-vindas."
              to="/app/onboarding"
              icon={<Palette className="size-4" />}
            />
            <QuickAction
              title="Mesas e QR codes"
              description="Cria mesas e imprime os respetivos QR."
              to="/app/tables"
              icon={<Store className="size-4" />}
            />
            <QuickAction
              title="Equipa"
              description="Gere os acessos ao painel."
              to="/app/team"
              icon={<Users className="size-4" />}
            />
            <QuickAction
              title="Links & QR"
              description="Partilha o menu sem indicar mesa."
              to="/app/links"
              icon={<QrCode className="size-4" />}
            />
          </>
        ) : null}
        <QuickAction
          title="Pedidos do balcão"
          description="Consulta a fila e acompanha a preparação."
          to="/app/orders"
          icon={<Clock className="size-4" />}
          actionLabel="Abrir fila"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  title,
  description,
  to,
  icon,
  actionLabel = "Configurar",
}: {
  title: string;
  description: string;
  to:
    | "/app/onboarding"
    | "/app/tables"
    | "/app/team"
    | "/app/links"
    | "/app/orders";
  icon: ReactNode;
  actionLabel?: string;
}) {
  return (
    <Link to={to} className="group">
      <Card className="h-full transition-colors group-hover:border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            {actionLabel}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
