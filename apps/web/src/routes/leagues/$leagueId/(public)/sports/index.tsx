import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import * as m from "@/paraglide/messages";
import { Badge } from "@sports-system/ui/components/badge";

import { resolveRosterSize } from "@/shared/lib/sports";
import { sportListQueryOptions } from "@/features/sports/api/queries";
import type { SportType, SportResponse } from "@/types/sports";
import { TableLayout } from "@/shared/components/ui/table-layout";
import { PageSingleLayout } from "@/shared/components/layouts/page-single-layout";

export const Route = createFileRoute("/leagues/$leagueId/(public)/sports/")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(sportListQueryOptions()),
  component: SportsPage,
});

function getTypeLabel(type: SportType): string {
  return type === "INDIVIDUAL"
    ? m['sports.type.individual']()
    : m['sports.type.team']();
}

function SportsPage() {
  const { data } = useSuspenseQuery(sportListQueryOptions());
  const { leagueId } = Route.useParams();
  const sports = data.data;

  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return sports;
    const lower = searchQuery.toLowerCase();
    return sports.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        getTypeLabel(s.sport_type).toLowerCase().includes(lower),
    );
  }, [sports, searchQuery]);

  const columns: ColumnDef<SportResponse>[] = [
    {
      header: m['sports.public.table.name'](),
      accessorKey: "name",
      meta: { className: "ps-4" },
      cell: ({ row }) => (
        <Link
          to="/leagues/$leagueId/sports/$sportId"
          params={{ leagueId, sportId: String(row.original.id) }}
          className="font-medium no-underline! hover:text-primary"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      header: m['sports.public.table.type'](),
      accessorKey: "sport_type",
      meta: { className: "w-32" },
      cell: ({ row }) => (
        <Badge variant="secondary">{getTypeLabel(row.original.sport_type)}</Badge>
      ),
    },
    {
      header: m['sports.public.table.athletes'](),
      accessorKey: "player_count",
      meta: { className: "pe-4 w-40" },
      cell: ({ row }) =>
        row.original.player_count != null
          ? row.original.sport_type === "INDIVIDUAL"
            ? `${row.original.player_count} atleta(s)`
            : `${resolveRosterSize(row.original.player_count, row.original.rules_json)} atleta(s) por equipe`
          : "—",
    },
  ];

  return (
    <PageSingleLayout title={m['sports.public.title']()}>
      <TableLayout
        countLabel={m['sports.public.title']()}
        columns={columns}
        data={filteredData}
        emptyMessage={m['sports.public.empty']()}
        searchPlaceholder={m['common.table.searchPlaceholder']()}
        searchQuery={searchQuery}
        onSearchChange={(value) => setSearchQuery(value)}
        activeFilterCount={searchQuery ? 1 : 0}
        onClearFilters={() => setSearchQuery("")}
      />
    </PageSingleLayout>
  );
}
