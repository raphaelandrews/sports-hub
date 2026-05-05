import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
  TrophyIcon,
  FunnelIcon,
} from "lucide-react";

import * as m from "@/paraglide/messages";
import { formatDate, formatTime } from "@/shared/lib/date";
import { allEventsQueryOptions } from "@/features/events/api/queries";
import { competitionListQueryOptions } from "@/features/competitions/api/queries";
import type { EventResponse, EventStatus } from "@/types/events";
import { TableLayout } from "@/shared/components/ui/table-layout";
import { PageSingleLayout } from "@/shared/components/layouts/page-single-layout";
import { seoMeta } from "@/shared/lib/seo";

export const Route = createFileRoute("/leagues/$leagueId/(public)/calendar/")({
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    Promise.all([
      queryClient.ensureQueryData(competitionListQueryOptions(Number(leagueId))),
      queryClient.ensureQueryData(
        allEventsQueryOptions(Number(leagueId), { per_page: 100 }),
      ),
    ]),
  head: () => seoMeta({ title: m["calendar.public.title"](), description: "Calendário de eventos e competições." }),
  component: CalendarPage,
});

const STATUS_META: Record<
  EventStatus,
  { label: string; icon: typeof CheckIcon; cls: string }
> = {
  SCHEDULED: { label: m['common.status.scheduled'](), icon: CircleIcon, cls: "text-muted-foreground" },
  IN_PROGRESS: { label: m['common.status.live'](), icon: CircleDotIcon, cls: "text-amber-500" },
  COMPLETED: { label: m['common.status.completed'](), icon: CheckIcon, cls: "text-emerald-500" },
  CANCELLED: { label: m['common.status.cancelled'](), icon: CircleDashedIcon, cls: "text-destructive" },
};

function CalendarPage() {
  const { leagueId } = Route.useParams();
  const { data: competitionsData } = useSuspenseQuery(
    competitionListQueryOptions(Number(leagueId)),
  );
  const competitions = competitionsData.data;
  const { data: eventsData } = useSuspenseQuery(
    allEventsQueryOptions(Number(leagueId), { per_page: 100 }),
  );
  const events = eventsData.data;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompetitionIds, setSelectedCompetitionIds] = useState<
    number[]
  >([]);
  const [selectedStatuses, setSelectedStatuses] = useState<EventStatus[]>([]);

  const filteredData = useMemo(() => {
    let data = events;

    if (selectedCompetitionIds.length > 0) {
      data = data.filter((item) =>
        selectedCompetitionIds.includes(item.competition_id),
      );
    }

    if (selectedStatuses.length > 0) {
      data = data.filter((item) => selectedStatuses.includes(item.status));
    }

    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      data = data.filter((item) => {
        const comp = competitions.find((c) => c.id === item.competition_id);
        const haystack = [
          item.event_date,
          item.start_time,
          item.venue ?? "",
          item.phase,
          STATUS_META[item.status].label,
          comp ? `competicao ${comp.number}` : "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(lower);
      });
    }

    return data.sort(
      (a, b) =>
        new Date(a.event_date + "T" + a.start_time).getTime() -
        new Date(b.event_date + "T" + b.start_time).getTime(),
    );
  }, [events, selectedCompetitionIds, selectedStatuses, searchQuery, competitions]);

  const statusCounts = useMemo(() => {
    return events.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [events]);

  const competitionCounts = useMemo(() => {
    return events.reduce(
      (acc, item) => {
        acc[item.competition_id] = (acc[item.competition_id] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );
  }, [events]);

  const toggleCompetition = (id: number) => {
    setSelectedCompetitionIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const toggleStatus = (status: EventStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((v) => v !== status)
        : [...prev, status],
    );
  };

  const activeFilterCount =
    selectedCompetitionIds.length + selectedStatuses.length;

  const handleClearFilters = () => {
    setSelectedCompetitionIds([]);
    setSelectedStatuses([]);
    setSearchQuery("");
  };

  const columns: ColumnDef<EventResponse>[] = [
    {
      header: m['calendar.public.table.date'](),
      accessorKey: "event_date",
      meta: { className: "ps-4 w-28" },
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-2 font-mono text-muted-foreground text-xs">
          {formatDate(row.original.event_date)}
        </span>
      ),
    },
    {
      header: m['calendar.public.table.time'](),
      accessorKey: "start_time",
      meta: { className: "w-24" },
      cell: ({ row }) => formatTime(row.original.start_time),
    },
    {
      header: m['calendar.public.table.venue'](),
      accessorKey: "venue",
      cell: ({ row }) => (
        <span className="truncate font-medium">
          {row.original.venue ?? "—"}
        </span>
      ),
    },
    {
      header: m['calendar.public.table.phase'](),
      accessorKey: "phase",
      meta: { className: "w-32" },
      cell: ({ row }) => row.original.phase,
    },
    {
      header: m['calendar.public.table.status'](),
      accessorKey: "status",
      meta: { className: "w-36" },
      cell: ({ row }) => {
        const meta = STATUS_META[row.original.status];
        return (
          <Badge
            variant="outline"
            className={
              "font-mono text-[10px] " +
              (row.original.status === "SCHEDULED"
                ? "border-muted-foreground/30 text-muted-foreground"
                : row.original.status === "IN_PROGRESS"
                  ? "border-amber-500/30 text-amber-700 dark:text-amber-400"
                  : row.original.status === "COMPLETED"
                    ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                    : "border-destructive/30 text-destructive")
            }
          >
            {meta.label}
          </Badge>
        );
      },
    },
    {
      header: m['calendar.public.table.competition'](),
      accessorKey: "competition_id",
      meta: { className: "pe-4 w-40" },
      cell: ({ row }) => {
        const comp = competitions.find(
          (c) => c.id === row.original.competition_id,
        );
        return comp
          ? m['competition.admin.badge.competition']({ "competition.number": comp.number })
          : `ID ${row.original.competition_id}`;
      },
    },
  ];

  return (
    <PageSingleLayout title={m['calendar.public.title']()}>
      <TableLayout
        countLabel="eventos"
        columns={columns}
        data={filteredData}
        emptyMessage={m['calendar.public.empty']()}
        searchPlaceholder={m['common.table.searchPlaceholder']()}
        searchQuery={searchQuery}
        onSearchChange={(value) => setSearchQuery(value)}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        filterActions={
          <>
            <FacetButton
              label={m['calendar.public.filter.competition']()}
              icon={<TrophyIcon className="size-3.5" />}
              count={selectedCompetitionIds.length}
              chips={selectedCompetitionIds.map((id) => {
                const c = competitions.find((x) => x.id === id);
                return c ? m['competition.admin.badge.competition']({ "competition.number": c.number }) : String(id);
              })}
            >
              <div className="p-2">
                <div className="relative">
                  <input
                    placeholder={m['calendar.public.filter.placeholder']()}
                    className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/24"
                  />
                </div>
              </div>
              <Separator />
              <div className="flex flex-col p-1">
                {competitions.map((comp) => (
                  <Label
                    key={comp.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      checked={selectedCompetitionIds.includes(comp.id)}
                      onCheckedChange={() => toggleCompetition(comp.id)}
                    />
                    <span className="flex-1">{m['competition.admin.badge.competition']({ "competition.number": comp.number })}</span>
                    <span className="text-muted-foreground text-xs">
                      {competitionCounts[comp.id] ?? 0}
                    </span>
                  </Label>
                ))}
              </div>
            </FacetButton>

            <FacetButton
              label={m['calendar.public.filter.status']()}
              icon={<FunnelIcon className="size-3.5" />}
              count={selectedStatuses.length}
              chips={selectedStatuses.map((s) => STATUS_META[s].label)}
            >
              <div className="flex flex-col p-1">
                {(
                  ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as EventStatus[]
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
          </>
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
