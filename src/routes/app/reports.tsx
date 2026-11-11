import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReportSummary } from "@/hooks/use-reports";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { UserRole } from "@/types/api";
import type { ReportQuery } from "@/types/api";

export const Route = createFileRoute("/app/reports")({
  beforeLoad: () => {
    if (useAuthStore.getState().user?.role !== UserRole.ADMIN)
      throw redirect({ to: "/app" });
  },
  component: ReportsPage,
});

const filtersSchema = z
  .object({ from: z.string(), to: z.string() })
  .superRefine(({ from, to }, context) => {
    if (!from || !to) return;
    const days =
      Math.round(
        (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
          86_400_000,
      ) + 1;
    if (days < 1 || days > 31)
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "Escolhe um período entre 1 e 31 dias.",
      });
  });
type Filters = z.infer<typeof filtersSchema>;

function ReportsPage() {
  const [period, setPeriod] = useState<ReportQuery>({});
  const { data, isLoading, isError, error, isFetching, refetch } =
    useReportSummary(period);
  const form = useForm<Filters>({
    resolver: zodResolver(filtersSchema),
    defaultValues: { from: "", to: "" },
  });
  const money = data
    ? new Intl.NumberFormat("pt-AO", {
        style: "currency",
        currency: data.currency,
      })
    : null;
  const formatMoney = (cents: number) => money?.format(cents / 100) ?? "—";
  const maxDailySales = Math.max(
    1,
    ...(data?.days.map((day) => day.salesCents) ?? []),
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">
            Pedidos e vendas do teu restaurante.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          Actualizar
        </Button>
      </div>

      <form
        className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4"
        onSubmit={form.handleSubmit((values) =>
          setPeriod({
            from: values.from || undefined,
            to: values.to || undefined,
          }),
        )}
      >
        <div className="space-y-1">
          <Label htmlFor="report-from">De</Label>
          <Input id="report-from" type="date" {...form.register("from")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="report-to">Até</Label>
          <Input id="report-to" type="date" {...form.register("to")} />
        </div>
        <Button type="submit">Aplicar período</Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            form.reset();
            setPeriod({});
          }}
        >
          Últimos 7 dias
        </Button>
        {form.formState.errors.to && (
          <p role="alert" className="w-full text-sm text-destructive">
            {form.formState.errors.to.message}
          </p>
        )}
      </form>

      {isLoading ? (
        <p className="text-muted-foreground">A carregar relatório…</p>
      ) : isError ? (
        <p role="alert" className="text-destructive">
          {getApiErrorMessage(error, "Não foi possível carregar o relatório")}
        </p>
      ) : (
        data && (
          <>
            <p className="text-sm text-muted-foreground">
              Período: {data.from.split("-").reverse().join("/")} a{" "}
              {data.to.split("-").reverse().join("/")}. Vendas incluem pedidos
              aceites e em preparação, prontos ou entregues.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardDescription>Pedidos recebidos</CardDescription>
                  <CardTitle className="text-3xl">{data.ordersCount}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Vendas</CardDescription>
                  <CardTitle className="text-3xl">
                    {formatMoney(data.salesCents)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Vendas por dia</CardTitle>
                <CardDescription>
                  Os dias sem vendas aparecem com zero.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.days.map((day) => (
                  <div
                    key={day.date}
                    className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 sm:grid-cols-[4.5rem_minmax(0,1fr)_8rem]"
                  >
                    <span className="text-sm text-muted-foreground">
                      {day.date.slice(8)}/{day.date.slice(5, 7)}
                    </span>
                    <div
                      role="meter"
                      aria-label={`Vendas de ${day.date}`}
                      aria-valuemin={0}
                      aria-valuemax={maxDailySales}
                      aria-valuenow={day.salesCents}
                      className="h-4 overflow-hidden rounded-lg bg-muted"
                    >
                      <div
                        className="h-full rounded-lg bg-primary"
                        style={{
                          width: `${(day.salesCents / maxDailySales) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="col-start-2 text-right text-sm font-medium sm:col-start-3">
                      {formatMoney(day.salesCents)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Produtos mais vendidos</CardTitle>
                <CardDescription>
                  Até dez produtos, por quantidade vendida.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.topItems.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Vendas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topItems.map((item) => (
                        <TableRow
                          key={`${item.menuItemId}:${item.nameSnapshot}`}
                        >
                          <TableCell className="font-medium">
                            {item.nameSnapshot}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatMoney(item.salesCents)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Sem vendas neste período.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )
      )}
    </div>
  );
}
