import { useQuery } from "@tanstack/react-query";
import { getReportSummary } from "@/services/reports";
import { useAuthStore } from "@/stores/auth-store";
import { UserRole } from "@/types/api";
import type { ReportQuery } from "@/types/api";

export const reportKeys = {
  summary: (tenant: string | null, query: ReportQuery) =>
    ["reports", tenant, "summary", query] as const,
};

export function useReportSummary(query: ReportQuery) {
  const user = useAuthStore((state) => state.user);
  const tenant = user?.restaurantId ?? null;
  return useQuery({
    queryKey: reportKeys.summary(tenant, query),
    queryFn: ({ signal }) => getReportSummary(query, signal),
    enabled: user?.role === UserRole.ADMIN && Boolean(tenant),
    staleTime: 30_000,
  });
}
