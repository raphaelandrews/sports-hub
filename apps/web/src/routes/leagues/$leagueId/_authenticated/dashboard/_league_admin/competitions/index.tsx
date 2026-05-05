import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@sports-system/ui/components/badge";
import { buttonVariants } from "@sports-system/ui/components/button";
import { cn } from "@sports-system/ui/lib/utils";

import * as m from "@/paraglide/messages";
import { formatDate } from "@/shared/lib/date";
import { sportListQueryOptions } from "@/features/sports/api/queries";
import { competitionListQueryOptions } from "@/features/competitions/api/queries";
import { TableLayout } from "@/shared/components/ui/table-layout";
import { Title } from "@/shared/components/ui/title";
import { SideCard } from "@/shared/components/ui/side-card";
import { PageAsideLayout } from "@/shared/components/layouts/page-aside-layout";
import type { CompetitionResponse, CompetitionStatus } from "@/types/competitions";

export const Route = createFileRoute(
  "/leagues/$leagueId/_authenticated/dashboard/_league_admin/competitions/",
)({
  ssr: false,
  loader: ({ context: { queryClient }, params: { leagueId } }) => {
    void queryClient.prefetchQuery(competitionListQueryOptions(Number(leagueId)));
    void queryClient.prefetchQuery(sportListQueryOptions());
  },
  component: AdminCompetitionsPage,
});

const statusLabel: Record<CompetitionStatus, string> = {
  DRAFT: m['common.status.draft'](),
  SCHEDULED: m['common.status.scheduled'](),
  LOCKED: m['common.status.locked'](),
  ACTIVE: m['common.status.active'](),
  COMPLETED: m['common.status.completed'](),
};

function AdminCompetitionsPage() {
  const { leagueId } = Route.useParams();
  const { data: competitions } = useSuspenseQuery(competitionListQueryOptions(Number(leagueId)));
  const { data: sports } = useSuspenseQuery(sportListQueryOptions());

  const [searchQuery, setSearchQuery] = useState("");

  const sportNamesById = useMemo(
    () => new Map(sports.data.map((sport) => [sport.id, sport.name])),
    [sports.data],
  );
  const transferInfo = getTransferWindowInfo();

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return competitions.data;
    const lower = searchQuery.toLowerCase();
    return competitions.data.filter((c) =>
      String(c.number).includes(lower) ||
      statusLabel[c.status].toLowerCase().includes(lower) ||
      formatDate(c.start_date).toLowerCase().includes(lower),
    );
  }, [competitions.data, searchQuery]);

  const columns: ColumnDef<CompetitionResponse>[] = [
    {
      header: m['competitions.admin.table.competition'](),
      accessorKey: "number",
      cell: ({ row }) => <span className="font-medium">#{row.original.number}</span>,
    },
    {
      header: m['competitions.admin.table.period'](),
      accessorKey: "start_date",
      cell: ({ row }) =>
        `${formatDate(row.original.start_date)} até ${formatDate(row.original.end_date)}`,
    },
    {
      header: m['competitions.admin.table.status'](),
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "ACTIVE" ? "secondary" : "outline"}>
          {statusLabel[row.original.status]}
        </Badge>
      ),
    },
    {
      header: m['competitions.admin.table.sports'](),
      accessorKey: "sport_focus",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.sport_focus.length > 0
            ? row.original.sport_focus
                .filter((sportId): sportId is number => typeof sportId === "number")
                .map((sportId) => sportNamesById.get(sportId) ?? `#${sportId}`)
                .join(", ")
            : "Sem foco definido"}
        </span>
      ),
    },
    {
      header: m['competitions.admin.table.actions'](),
      accessorKey: "id",
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <Link
          to="/leagues/$leagueId/dashboard/competitions/$competitionId"
          params={{ leagueId, competitionId: String(row.original.id) }}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {m['common.actions.open']()}
        </Link>
      ),
    },
  ];

  return (
    <PageAsideLayout
      sidebar={
        <SideCard title={m['competitions.admin.card.transfer.title']()}>
          <p className="text-sm text-muted-foreground mb-4">
            {m['competitions.admin.card.transfer.desc']()}
          </p>
          <div className="space-y-3">
            <Badge variant={transferInfo.open ? "secondary" : "outline"} className="w-full justify-center">
              {transferInfo.open ? m['chief.shell.badge.open']() : m['chief.shell.badge.closed']()}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {transferInfo.open
                ? m['transferWindow.openMessage']()
                : `Próxima janela: ${transferInfo.nextLabel}.`}
            </p>
            <Link
              to="/leagues/$leagueId/dashboard/competitions/new"
              params={{ leagueId }}
              className={cn(buttonVariants({ variant: "default" }), "w-full justify-start")}
            >
              {m['competition.form.title']()}
            </Link>
          </div>
        </SideCard>
      }
    >
      <Title title={m['competitions.admin.title']()} description={m['competitions.admin.card.transfer.desc']()} />

      <div className="w-full flex justify-center mt-6">
        <div className="flex gap-4">
          <StatCard label={m['competitions.admin.stat.total']()} value={String(competitions.data.length)} />
          <StatCard label={m['competitions.admin.stat.active']()} value={String(competitions.data.filter((c) => c.status === "ACTIVE").length)} />
          <StatCard label={m['competitions.admin.stat.locked']()} value={String(competitions.data.filter((c) => ["LOCKED", "ACTIVE", "COMPLETED"].includes(c.status)).length)} />
        </div>
      </div>

      <div className="w-full mt-6">
        <TableLayout
          columns={columns}
          data={filteredData}
          searchQuery={searchQuery}
          onSearchChange={(value) => setSearchQuery(value)}
        />
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

function getTransferWindowInfo() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((part) => [part.type, part.value]),
  );

  const weekday = parts.weekday;
  const open = weekday === "Mon";

  const current = new Date(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00`,
  );
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  const daysUntilMonday = (8 - dayIndex) % 7 || 7;
  const nextMonday = new Date(current);
  nextMonday.setDate(current.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);

  return {
    open,
    nextLabel: nextMonday.toLocaleString("pt-BR", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }),
  };
}
