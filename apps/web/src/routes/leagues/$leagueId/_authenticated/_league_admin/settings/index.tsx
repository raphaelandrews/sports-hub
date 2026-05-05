import { useMemo, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@sports-system/ui/components/badge";
import { Button } from "@sports-system/ui/components/button";
import { Checkbox } from "@sports-system/ui/components/checkbox";
import { Input } from "@sports-system/ui/components/input";
import { Label } from "@sports-system/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";

import { client, unwrap, ApiError } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";
import {
  leagueDetailQueryOptions,
  leagueMembersQueryOptions,
} from "@/features/leagues/api/queries";
import { sportListQueryOptions } from "@/features/sports/api/queries";
import { ImageUpload } from "@/shared/components/ui/image-upload";
import { TableLayout } from "@/shared/components/ui/table-layout";
import { Title } from "@/shared/components/ui/title";
import type { LeagueMemberRole } from "@/types/leagues";
import * as m from "@/paraglide/messages";
import { CardWrapper } from "@/shared/components/ui/card-wrapper";

function getRoleLabel(role: LeagueMemberRole): string {
  switch (role) {
    case "LEAGUE_ADMIN":
      return m["league.settings.role.admin"]();
    case "CHIEF":
      return m["league.settings.role.chief"]();
    case "COACH":
      return m["league.settings.role.coach"]();
    case "ATHLETE":
      return m["league.settings.role.athlete"]();
  }
}

export const Route = createFileRoute("/leagues/$leagueId/_authenticated/_league_admin/settings/")({
  component: LeagueSettingsPage,
});

function LeagueSettingsPage() {
  const { leagueId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const lid = Number(leagueId);

  const { data: league } = useSuspenseQuery(leagueDetailQueryOptions(lid));
  const { data: members } = useSuspenseQuery(leagueMembersQueryOptions(lid));
  const { data: sports } = useSuspenseQuery(sportListQueryOptions());

  const [name, setName] = useState(league.name);
  const [slug, setSlug] = useState(league.slug);
  const [description, setDescription] = useState(league.description ?? "");
  const [logoUrl, setLogoUrl] = useState(league.logo_url ?? "");
  const [timezone, setTimezone] = useState(league.timezone);
  const [selectedSports, setSelectedSports] = useState<number[]>(league.sports_config);
  const [transferWindow, setTransferWindow] = useState(league.transfer_window_enabled);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const lower = searchQuery.toLowerCase();
    return members.filter(
      (member) =>
        String(member.user_id).includes(lower) ||
        getRoleLabel(member.role).toLowerCase().includes(lower),
    );
  }, [members, searchQuery]);

  const updateMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      slug: string;
      description: string;
      logo_url?: string;
      timezone: string;
      sports_config: number[];
      transfer_window_enabled: boolean;
    }) =>
      unwrap(
        client.PATCH("/leagues/{league_id}", {
          params: { path: { league_id: lid } },
          body: payload,
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.leagues.detail(lid) });
      toast.success(m["league.settings.toast.updateSuccess"]());
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : m["league.settings.toast.updateError"]());
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () =>
      unwrap(client.DELETE("/leagues/{league_id}", { params: { path: { league_id: lid } } })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.leagues.all() });
      toast.success(m["league.settings.toast.archiveSuccess"]());
      await navigate({ to: "/leagues" });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : m["league.settings.toast.archiveError"]());
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: LeagueMemberRole }) =>
      unwrap(
        client.PATCH("/leagues/{league_id}/members/{user_id}", {
          params: { path: { league_id: lid, user_id: userId } },
          body: { role },
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.leagues.members(lid) });
      toast.success(m["league.settings.toast.roleSuccess"]());
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : m["league.settings.toast.roleError"]());
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) =>
      unwrap(
        client.DELETE("/leagues/{league_id}/members/{user_id}", {
          params: { path: { league_id: lid, user_id: userId } },
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.leagues.members(lid) });
      toast.success(m["league.settings.toast.removeSuccess"]());
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : m["league.settings.toast.removeError"]());
    },
  });

  const toggleSport = (sportId: number) => {
    setSelectedSports((prev) =>
      prev.includes(sportId) ? prev.filter((id) => id !== sportId) : [...prev, sportId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync({
      name,
      slug,
      description,
      logo_url: logoUrl.trim() || undefined,
      timezone,
      sports_config: selectedSports,
      transfer_window_enabled: transferWindow,
    });
  };

  const columns: ColumnDef<(typeof members)[number]>[] = [
    {
      header: m["league.settings.table.user"](),
      accessorKey: "user_id",
      meta: { className: "ps-4 w-24" },
      cell: ({ row }) => <span className="font-medium">#{row.original.user_id}</span>,
    },
    {
      header: m["league.settings.table.role"](),
      accessorKey: "role",
      meta: { className: "w-32" },
      cell: ({ row }) => <Badge variant="outline">{getRoleLabel(row.original.role)}</Badge>,
    },
    {
      header: m["league.settings.table.actions"](),
      accessorKey: "id",
      meta: { className: "pe-4 text-right" },
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Select
            value={row.original.role}
            onValueChange={(role) =>
              updateRoleMutation.mutate({
                userId: row.original.user_id,
                role: role as LeagueMemberRole,
              })
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["LEAGUE_ADMIN", "CHIEF", "COACH", "ATHLETE"] as LeagueMemberRole[]).map((role) => (
                <SelectItem key={role} value={role}>
                  {getRoleLabel(role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeMemberMutation.mutate(row.original.user_id)}
            disabled={removeMemberMutation.isPending}
          >
            {m["common.actions.remove"]()}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="min-h-screen bg-background">
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-4xl px-3 pt-2 pb-24 lg:px-4 lg:pt-8 lg:pb-12">
              <Title title={m["league.settings.title"]()}
              />

              <div className="mt-3 animate-[fadeInContent_200ms_ease-out] lg:mt-6">
                <div className="space-y-3 lg:space-y-6">
                  <CardWrapper title={m["league.settings.card.general.title"]()} description={m["league.settings.card.general.desc"]()} >
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">{m["league.settings.label.name"]()}</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slug">{m["league.settings.label.slug"]()}</Label>
                        <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">{m["league.settings.label.description"]()}</Label>
                        <textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      <ImageUpload
                        value={logoUrl}
                        onChange={setLogoUrl}
                        label={m["league.settings.label.logo"]()}
                        fallback={name.charAt(0) || "?"}
                      />
                      <div className="space-y-2">
                        <Label htmlFor="timezone">{m["league.settings.label.timezone"]()}</Label>
                        <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/Sao_Paulo">{m["league.settings.timezone.saoPaulo"]()}</SelectItem>
                            <SelectItem value="America/New_York">{m["league.settings.timezone.newYork"]()}</SelectItem>
                            <SelectItem value="Europe/London">{m["league.settings.timezone.london"]()}</SelectItem>
                            <SelectItem value="UTC">{m["league.settings.timezone.utc"]()}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{m["league.settings.label.sports"]()}</Label>
                        <div className="flex flex-wrap gap-4">
                          {sports.data.map((sport) => (
                            <label key={sport.id} className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedSports.includes(sport.id)}
                                onCheckedChange={() => toggleSport(sport.id)}
                              />
                              <span className="text-sm">{sport.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <Label>{m["league.settings.label.transferWindow"]()}</Label>
                          <p className="text-sm text-muted-foreground">
                            {m["league.settings.transferWindowDesc"]()}
                          </p>
                        </div>
                        <Checkbox
                          checked={transferWindow}
                          onCheckedChange={(checked) => setTransferWindow(checked === true)}
                        />
                      </div>
                      <Button type="submit" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? m["league.settings.submitting"]() : m["league.settings.submit"]()}
                      </Button>
                    </form>
                  </CardWrapper>

                  <CardWrapper title={m["league.settings.membersHeading"]()} description={m["league.settings.membersDesc"]()} >
                    <TableLayout
                      title={m["league.settings.membersHeading"]()}
                      countLabel={m["league.settings.membersCountLabel"]()}
                      columns={columns}
                      data={filteredData}
                      emptyMessage={m["league.settings.membersEmpty"]()}
                      searchPlaceholder={m["league.settings.searchPlaceholder"]()}
                      searchQuery={searchQuery}
                      onSearchChange={(value) => setSearchQuery(value)}
                      activeFilterCount={searchQuery ? 1 : 0}
                      onClearFilters={() => setSearchQuery("")}
                    />
                  </CardWrapper>

                  <CardWrapper title={m["league.settings.danger.title"]()} description={m["league.settings.danger.desc"]()}>
                    <Button
                      variant="destructive"
                      onClick={() => archiveMutation.mutate()}
                      disabled={archiveMutation.isPending}
                    >
                      {archiveMutation.isPending ? m["league.settings.archiving"]() : m["league.settings.archive"]()}
                    </Button>
                  </CardWrapper>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
