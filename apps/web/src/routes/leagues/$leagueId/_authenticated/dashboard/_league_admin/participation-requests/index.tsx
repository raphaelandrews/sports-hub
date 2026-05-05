import { useMemo, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Badge } from "@sports-system/ui/components/badge";
import { Button } from "@sports-system/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";
import { Check, X } from "lucide-react";
import { participationRequestsQueryOptions, type ParticipationRequest } from "@/features/delegations/api/queries";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import * as m from "@/paraglide/messages";
import { TableLayout } from "@/shared/components/ui/table-layout";
import { Title } from "@/shared/components/ui/title";
import { SideCard } from "@/shared/components/ui/side-card";
import { PageAsideLayout } from "@/shared/components/layouts/page-aside-layout";

export const Route = createFileRoute(
  "/leagues/$leagueId/_authenticated/dashboard/_league_admin/participation-requests/",
)({
  ssr: false,
  loader: ({ context: { queryClient }, params: { leagueId } }) => {
    void queryClient.prefetchQuery(participationRequestsQueryOptions(Number(leagueId)));
  },
  component: ParticipationRequestsPage,
});

const statusLabel: Record<string, string> = {
  PENDING: m["common.status.pending"](),
  APPROVED: m["common.status.approved"](),
  REJECTED: m["common.status.rejected"](),
};

const statusVariant: Record<string, string> = {
  PENDING: "border-amber-500/30 text-amber-700 dark:text-amber-400",
  APPROVED: "border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
  REJECTED: "border-destructive/30 text-destructive",
};

function ParticipationRequestsPage() {
  const { leagueId } = Route.useParams();
  const numericLeagueId = Number(leagueId);
  const queryClient = useQueryClient();
  const { data: requests } = useSuspenseQuery(participationRequestsQueryOptions(numericLeagueId));

  const reviewMutation = useMutation({
    mutationFn: ({ requestId, status }: { requestId: number; status: ParticipationRequest["status"] }) =>
      unwrap(
        client.POST("/leagues/{league_id}/delegations/participation-requests/{request_id}/review", {
          params: { path: { league_id: numericLeagueId, request_id: requestId } },
          body: { status },
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["participation-requests", numericLeagueId],
      });
      toast.success(m["common.actions.update"]());
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : m["common.actions.submit"]());
    },
  });

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    let data = [...requests];
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      data = data.filter((r) =>
        String(r.delegation_id).includes(lower) ||
        (statusLabel[r.status]?.toLowerCase() ?? "").includes(lower),
      );
    }
    return data;
  }, [requests, searchQuery]);

  const pagedData = filteredData.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize,
  );

  const pendingRequests = requests.filter((r: ParticipationRequest) => r.status === "PENDING");

  return (
    <PageAsideLayout
      sidebar={
        <SideCard title={m["notification.title.participation"]()}>
          <p className="text-sm text-muted-foreground mb-4">
            {m["notification.desc.participationPrefix"]()}
          </p>
          <div className="space-y-3">
            <Badge variant="outline" className="w-full justify-center">
              {m["common.actions.submit"]()
            }</Badge>
            <p className="text-xs text-muted-foreground">
              {pendingRequests.length} {m["enrollments.admin.stat.pending"]()}
            </p>
          </div>
        </SideCard>
      }
    >
      <Title title={m["notification.title.participation"]()} description={m["notification.desc.participationPrefix"]()} />

      <div className="w-full flex justify-center mt-6">
        <div className="flex gap-4">
          <StatCard label={m["enrollments.admin.stat.pending"]()} value={String(pendingRequests.length)} />
          <StatCard label={m["enrollments.admin.stat.total"]()} value={String(requests.length)} />
        </div>
      </div>

      <div className="w-full mt-6">
        <TableLayout
        totalCount={filteredData.length}
        visibleCount={pagedData.length}
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPageIndex(0);
        }}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="ps-4">{m["delegations.public.title"]()}</TableHead>
              <TableHead className="w-28">{m["enrollments.admin.table.status"]()}</TableHead>
              <TableHead className="w-36">{m["enrollments.admin.table.validation"]()}</TableHead>
              <TableHead className="pe-4 w-36 text-right">{m["enrollments.admin.table.actions"]()}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedData.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  {m["search.noResults"]()}
                </TableCell>
              </TableRow>
            )}
            {pagedData.map((request: ParticipationRequest) => (
              <TableRow key={request.id}>
                <TableCell className="ps-4">
                  <span className="font-medium">
                    {m["delegations.public.title"]()} #{request.delegation_id}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusVariant[request.status] ?? ""}
                  >
                    {statusLabel[request.status] ?? request.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-xs">
                    {new Date(request.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </TableCell>
                <TableCell className="pe-4 text-right">
                  {request.status === "PENDING" ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        disabled={reviewMutation.isPending}
                        onClick={() =>
                          reviewMutation.mutate({ requestId: request.id, status: "REJECTED" })
                        }
                      >
                        <X className="size-3.5 mr-1" />
                        {m["notification.action.refuse"]()}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400"
                        disabled={reviewMutation.isPending}
                        onClick={() =>
                          reviewMutation.mutate({ requestId: request.id, status: "APPROVED" })
                        }
                      >
                        <Check className="size-3.5 mr-1" />
                        {m["notification.action.accept"]()}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      {request.status === "APPROVED" ? m["common.status.approved"]() : m["common.status.rejected"]()}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableLayout>
      </div>
    </PageAsideLayout>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 w-25 rounded-lg bg-input px-3 py-2 min-w-11">
      <div className="text-[9px] uppercase tracking-widest text-placeholder leading-none">{label}</div>
      <div className="text-xl font-bold tabular-nums text-foreground leading-none">{value}</div>
    </div>
  );
}
