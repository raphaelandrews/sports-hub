import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@sports-system/ui/components/badge";
import { Button } from "@sports-system/ui/components/button";
import { Checkbox } from "@sports-system/ui/components/checkbox";
import { Label } from "@sports-system/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@sports-system/ui/components/popover";
import { Separator } from "@sports-system/ui/components/separator";
import {
  CircleIcon,
  CircleDotIcon,
  CircleDashedIcon,
  CheckIcon,
  FunnelIcon,
} from "lucide-react";

import * as m from "@/paraglide/messages";
import { formatDate } from "@/shared/lib/date";
import { competitionListQueryOptions } from "@/features/competitions/api/queries";
import type { CompetitionResponse, CompetitionStatus } from "@/types/competitions";
import { TableLayout } from "@/shared/components/ui/table-layout";
import { PageSingleLayout } from "@/shared/components/layouts/page-single-layout";

export const Route = createFileRoute("/leagues/$leagueId/(public)/competitions/")({
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    queryClient.ensureQueryData(competitionListQueryOptions(Number(leagueId))),
  component: CompetitionsPage,
});

const STATUS_META: Record<
  CompetitionStatus,
  { label: string; icon: typeof CheckIcon; cls: string }
> = {
  DRAFT: { label: m['common.status.draft'](), icon: CircleIcon, cls: "text-muted-foreground" },
  SCHEDULED: { label: m['common.status.scheduled'](), icon: CircleDotIcon, cls: "text-sky-500" },
  LOCKED: { label: m['common.status.locked'](), icon: CircleDashedIcon, cls: "text-amber-500" },
  ACTIVE: { label: m['common.status.active'](), icon: CircleDotIcon, cls: "text-emerald-500" },
  COMPLETED: { label: m['common.status.completed'](), icon: CheckIcon, cls: "text-violet-500" },
};

function CompetitionsPage() {
  const { leagueId } = Route.useParams();
  const { data } = useSuspenseQuery(
    competitionListQueryOptions(Number(leagueId)),
  );
  const competitions = data.data;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<CompetitionStatus[]>(
    [],
  );

  const filteredData = useMemo(() => {
    let data = [...competitions];

    if (selectedStatuses.length > 0) {
      data = data.filter((item) => selectedStatuses.includes(item.status));
    }

    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      data = data.filter((item) => {
        const haystack = [
          String(item.number),
          formatDate(item.start_date),
          formatDate(item.end_date),
          STATUS_META[item.status].label,
          String(item.sport_focus.length),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(lower);
      });
    }

    return data.sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
    );
  }, [competitions, selectedStatuses, searchQuery]);

  const statusCounts = useMemo(() => {
    return competitions.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [competitions]);

  const toggleStatus = (status: CompetitionStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((v) => v !== status)
        : [...prev, status],
    );
  };

  const activeFilterCount = selectedStatuses.length;

  const handleClearFilters = () => {
    setSelectedStatuses([]);
    setSearchQuery("");
  };

  const columns: ColumnDef<CompetitionResponse>[] = [
    {
      header: m['competitions.public.table.competition'](),
      accessorKey: "number",
      meta: { className: "ps-4 w-40" },
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-2 font-mono text-muted-foreground text-xs">
          <span className="font-medium text-foreground text-sm">
            {m['competition.admin.badge.competition']({ 'competition.number': row.original.number })}
          </span>
        </span>
      ),
    },
    {
      header: m['competitions.public.table.period'](),
      accessorKey: "start_date",
      meta: { className: "w-32" },
      cell: ({ row }) => (
        <span className="text-sm">
          {formatDate(row.original.start_date)} – {formatDate(row.original.end_date)}
        </span>
      ),
    },
    {
      header: m['competitions.public.table.status'](),
      accessorKey: "status",
      meta: { className: "w-36" },
      cell: ({ row }) => {
        const meta = STATUS_META[row.original.status];
        return (
          <Badge
            variant="outline"
            className={
              "font-mono text-[10px] " +
              (row.original.status === "DRAFT"
                ? "border-muted-foreground/30 text-muted-foreground"
                : row.original.status === "SCHEDULED"
                  ? "border-sky-500/30 text-sky-700 dark:text-sky-400"
                  : row.original.status === "LOCKED"
                    ? "border-amber-500/30 text-amber-700 dark:text-amber-400"
                    : row.original.status === "ACTIVE"
                      ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                      : "border-violet-500/30 text-violet-700 dark:text-violet-400")
            }
          >
            {meta.label}
          </Badge>
        );
      },
    },
    {
      header: m['competitions.public.table.sports'](),
      accessorKey: "sport_focus",
      meta: { className: "w-24" },
      cell: ({ row }) => (
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted font-mono text-[10px] tabular-nums">
          {row.original.sport_focus.length}
        </span>
      ),
    },
    {
      header: m['competitions.public.table.actions'](),
      accessorKey: "id",
      meta: { className: "pe-4 w-40 text-right" },
      cell: ({ row }) => (
        <Link
          to="/leagues/$leagueId/competitions/$competitionId"
          params={{
            leagueId,
            competitionId: String(row.original.id),
          }}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          {m['common.actions.view']()}
        </Link>
      ),
    },
  ];

  return (
    <PageSingleLayout title={m['competitions.public.title']()}>
      <TableLayout
        countLabel="competições"
        columns={columns}
        data={filteredData}
        emptyMessage={m['competitions.public.empty']()}
        searchPlaceholder={m['common.table.searchPlaceholder']()}
        searchQuery={searchQuery}
        onSearchChange={(value) => setSearchQuery(value)}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        filterActions={
          <FacetButton
            label={m['competitions.public.filter.status']()}
            icon={<FunnelIcon className="size-3.5" />}
            count={selectedStatuses.length}
            chips={selectedStatuses.map((s) => STATUS_META[s].label)}
          >
            <div className="flex flex-col p-1">
              {(
                [
                  "DRAFT",
                  "SCHEDULED",
                  "LOCKED",
                  "ACTIVE",
                  "COMPLETED",
                ] as CompetitionStatus[]
              ).map((status) => {
                const meta = STATUS_META[status];
                const Icon = meta.icon;
                return (
                  <Label
                    key={status}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      checked={selectedStatuses.includes(status)}
                      onCheckedChange={() => toggleStatus(status)}
                    />
                    <Icon className={"size-3.5 " + meta.cls} />
                    <span className="flex-1">{meta.label}</span>
                    <span className="text-muted-foreground text-xs">
                      {statusCounts[status] ?? 0}
                    </span>
                  </Label>
                );
              })}
            </div>
          </FacetButton>
        }
      />
    </PageSingleLayout>
  );
}

function FacetButton({
  label,
  icon,
  count,
  chips,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  count?: number;
  chips?: string[];
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className={
              count && count > 0
                ? "border-foreground/20 bg-foreground/5"
                : "border-dashed"
            }
          >
            {icon}
            {label}
            {count && count > 0 ? (
              <>
                <Separator orientation="vertical" className="mx-1 h-3" />
                {chips && chips.length <= 2 ? (
                  chips.map((c) => (
                    <Badge
                      key={c}
                      variant="secondary"
                      className="font-mono text-[10px]"
                    >
                      {c}
                    </Badge>
                  ))
                ) : (
                  <Badge
                    variant="secondary"
                    className="font-mono text-[10px]"
                  >
                    {count}
                  </Badge>
                )}
              </>
            ) : null}
          </Button>
        }
      />
      <PopoverContent className="w-60 p-0" align="start">
        {children}
      </PopoverContent>
    </Popover>
  );
}
