import { useMemo, useState } from "react";
import { Badge } from "@sports-system/ui/components/badge";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";

import { TableLayout } from "@/shared/components/ui/table-layout";
import { Title } from "@/shared/components/ui/title";
import { SideCard } from "@/shared/components/ui/side-card";
import { PageAsideLayout } from "@/shared/components/layouts/page-aside-layout";
import { medalBoardQueryOptions } from "@/features/results/api/queries";
import { sportListQueryOptions } from "@/features/sports/api/queries";
import type { MedalBoardEntry } from "@/types/results";
import * as m from "@/paraglide/messages";

export const Route = createFileRoute("/leagues/$leagueId/(public)/results/")({
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    Promise.all([
      queryClient.ensureQueryData(medalBoardQueryOptions(Number(leagueId))),
      queryClient.ensureQueryData(sportListQueryOptions()),
    ]),
  component: ResultsPage,
});

function ResultsPage() {
  const { leagueId } = Route.useParams();
  const { data } = useSuspenseQuery({
    ...medalBoardQueryOptions(Number(leagueId)),
    refetchInterval: 30_000,
  });
  const { data: sports } = useSuspenseQuery(sportListQueryOptions());

  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const lower = searchQuery.toLowerCase();
    return data.filter(
      (entry) =>
        entry.delegation_name.toLowerCase().includes(lower) ||
        entry.delegation_code.toLowerCase().includes(lower),
    );
  }, [data, searchQuery]);

  const columns: ColumnDef<MedalBoardEntry>[] = [
    {
      header: "#",
      accessorKey: "delegation_id",
      meta: { className: "ps-4 w-14" },
      cell: ({ row }) => (
        <span className="font-medium text-muted-foreground">{row.index + 1}</span>
      ),
    },
    {
      header: m["results.public.table.delegation"](),
      accessorKey: "delegation_name",
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{row.original.delegation_name}</span>
          <Badge
            variant="outline"
            className="font-mono text-[10px] uppercase tracking-[0.2em]"
          >
            {row.original.delegation_code}
          </Badge>
        </div>
      ),
    },
    {
      header: "🥇",
      accessorKey: "gold",
      meta: { className: "text-center" },
      cell: ({ row }) => <span className="font-semibold">{row.original.gold}</span>,
    },
    {
      header: "🥈",
      accessorKey: "silver",
      meta: { className: "text-center" },
      cell: ({ row }) => <span className="font-semibold">{row.original.silver}</span>,
    },
    {
      header: "🥉",
      accessorKey: "bronze",
      meta: { className: "text-center" },
      cell: ({ row }) => <span className="font-semibold">{row.original.bronze}</span>,
    },
    {
      header: m["competition.detail.table.total"](),
      accessorKey: "total",
      meta: { className: "pe-4 text-center" },
      cell: ({ row }) => <span className="font-bold">{row.original.total}</span>,
    },
  ];

  return (
    <PageAsideLayout
      sidebar={
        <SideCard title={m["results.public.card.nav.title"]()}
        >
          <div className="space-y-3">
            <Link
              to="/leagues/$leagueId/results/records"
              params={{ leagueId }}
              className="block text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              {m["results.records.title"]()}
            </Link>
            {sports.data.slice(0, 6).map((sport) => (
              <Link
                key={sport.id}
                to="/leagues/$leagueId/results/sports/$sportId"
                params={{ leagueId, sportId: String(sport.id) }}
                className="block text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                {sport.name}
              </Link>
            ))}
          </div>
        </SideCard>
      }
    >
      <Title title={m["results.public.title"]()}
        description={m["results.public.section.medalBoard"]()}
      />

      <div className="w-full flex justify-center mt-6">
        <div className="flex gap-4">
          <StatCard label={m["results.public.pill.ranking"]()} value={String(data.length)} />
          <StatCard label={m["results.public.pill.golds"]()} value={String(data.reduce((sum, entry) => sum + entry.gold, 0))} />
          <StatCard label={m["results.public.pill.total"]()} value={String(data.reduce((sum, entry) => sum + entry.total, 0))} />
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
