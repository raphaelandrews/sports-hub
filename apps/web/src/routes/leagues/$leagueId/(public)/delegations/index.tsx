import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@sports-system/ui/components/avatar";
import { Badge } from "@sports-system/ui/components/badge";

import * as m from "@/paraglide/messages";
import { delegationListQueryOptions } from "@/features/delegations/api/queries";
import { TableLayout } from "@/shared/components/ui/table-layout";
import { PageSingleLayout } from "@/shared/components/layouts/page-single-layout";
import type { DelegationResponse } from "@/types/delegations";
import { seoMeta } from "@/shared/lib/seo";

export const Route = createFileRoute("/leagues/$leagueId/(public)/delegations/")({
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    queryClient.ensureQueryData(delegationListQueryOptions(Number(leagueId))),
  head: () => seoMeta({ title: m["delegations.public.title"](), description: "Delegações participantes da liga." }),
  component: DelegationsPage,
});

function DelegationsPage() {
  const { leagueId } = Route.useParams();
  const { data } = useSuspenseQuery(delegationListQueryOptions(Number(leagueId)));
  const delegations = data.data;

  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return delegations;
    const lower = searchQuery.toLowerCase();
    return delegations.filter(
      (d) =>
        d.name.toLowerCase().includes(lower) ||
        d.code.toLowerCase().includes(lower),
    );
  }, [delegations, searchQuery]);

  const columns: ColumnDef<DelegationResponse>[] = [
    {
      header: m['delegations.public.table.code'](),
      accessorKey: "code",
      meta: { className: "ps-4 w-32" },
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono text-[10px]">
          {row.original.code}
        </Badge>
      ),
    },
    {
      header: m['delegations.public.table.name'](),
      accessorKey: "name",
      meta: { className: "pe-4" },
      cell: ({ row }) => (
        <Link
          to="/leagues/$leagueId/delegations/$delegationId"
          params={{ leagueId, delegationId: String(row.original.id) }}
          className="flex items-center gap-2 no-underline! hover:text-primary"
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={row.original.flag_url ?? ""} alt={row.original.name} />
            <AvatarFallback className="text-xs">
              {row.original.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.original.name}</span>
        </Link>
      ),
    },
  ];

  return (
    <PageSingleLayout title={m['delegations.public.title']()}>
      <TableLayout
        countLabel="delegações"
        columns={columns}
        data={filteredData}
        emptyMessage={m['delegations.public.empty']()}
        searchPlaceholder={m['common.table.searchPlaceholder']()}
        searchQuery={searchQuery}
        onSearchChange={(value) => setSearchQuery(value)}
        activeFilterCount={searchQuery ? 1 : 0}
        onClearFilters={() => setSearchQuery("")}
      />
    </PageSingleLayout>
  );
}
