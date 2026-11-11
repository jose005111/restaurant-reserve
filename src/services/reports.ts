import { api } from "@/lib/api";
import type { ReportQuery, ReportSummary } from "@/types/api";

export async function getReportSummary(
  params: ReportQuery,
  signal?: AbortSignal,
): Promise<ReportSummary> {
  return (await api.get<ReportSummary>("/reports/summary", { params, signal }))
    .data;
}
