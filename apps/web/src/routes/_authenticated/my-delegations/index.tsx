import { useMemo, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import * as m from "@/paraglide/messages";
import { Badge } from "@sports-system/ui/components/badge";
import { Button, buttonVariants } from "@sports-system/ui/components/button";
import { SideCard } from "@/shared/components/ui/side-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@sports-system/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@sports-system/ui/components/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";
import { cn } from "@sports-system/ui/lib/utils";
import { MoreHorizontal, Pencil, ExternalLink, Hand, Sparkles, Bot, Send } from "lucide-react";
import { PageAsideLayout } from "@/shared/components/layouts/page-aside-layout";
import { TableLayout } from "@/shared/components/ui/table-layout";
import { myDelegationsQueryOptions } from "@/features/delegations/api/queries";
import { leagueListQueryOptions } from "@/features/leagues/api/queries";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";
import type { DelegationResponse } from "@/types/delegations";
import { Title } from "@/shared/components/ui/title";

export const Route = createFileRoute("/_authenticated/my-delegations/")({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(myDelegationsQueryOptions()),
      queryClient.ensureQueryData(leagueListQueryOptions()),
    ]),
  component: MyDelegationsPage,
});

const statusLabel: Record<string, string> = {
  INDEPENDENT: m['myDelegations.stat.independent'](),
  PENDING: m['common.status.pending'](),
  APPROVED: m['common.status.approved'](),
  REJECTED: m['common.status.rejected'](),
};

const statusVariant: Record<string, string> = {
  INDEPENDENT: "border-muted-foreground/30 text-muted-foreground",
  PENDING: "border-amber-500/30 text-amber-700 dark:text-amber-400",
  APPROVED: "border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
  REJECTED: "border-destructive/30 text-destructive",
};

function MyDelegationsPage() {
  const { data: delegations } = useSuspenseQuery(myDelegationsQueryOptions());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [selectedDelegation, setSelectedDelegation] = useState<DelegationResponse | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    let data = [...delegations];
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      data = data.filter(
        (d) =>
          d.name.toLowerCase().includes(lower) ||
          d.code.toLowerCase().includes(lower),
      );
    }
    return data;
  }, [delegations, searchQuery]);

  const pagedData = filteredData.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize,
  );

  return (
    <PageAsideLayout
      sidebar={
        <SideCard title={m['myDelegations.card.controls.title']()}>
          <p className="text-sm text-muted-foreground mb-4">
            {m['myDelegations.card.controls.desc']()}
          </p>
          <div className="space-y-3">
            <Link
              to="/delegations/new"
              className={cn(buttonVariants({ variant: "default" }), "w-full justify-start")}
            >
              <Sparkles className="mr-2 size-4" />
              {m['delegation.new.title']()}
            </Link>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setAiDialogOpen(true)}
            >
              <Bot className="mr-2 size-4" />
              {m['common.actions.create']()}
            </Button>
          </div>
        </SideCard>
      }
    >
      <Title title={m['myDelegations.card.title']()} description={m['myDelegations.card.controls.desc']()} />

      <div className="w-full flex justify-center mt-6">
        <div className="flex gap-4">
          <StatCard label={m['myDelegations.stat.total']()} value={String(delegations.length)} />
          <StatCard
            label={m['myDelegations.stat.independent']()}
            value={String(delegations.filter((d) => d.status === "INDEPENDENT").length)}
          />
          <StatCard
            label={m['myDelegations.stat.inLeague']()}
            value={String(delegations.filter((d) => d.league_id != null).length)}
          />
        </div>
      </div>

      <div className="w-full mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-placeholder">{m['myDelegations.listHeading']()}</h2>

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
                <TableHead className="ps-4">{m['myDelegations.table.name']()}</TableHead>
                <TableHead className="w-28">{m['myDelegations.table.code']()}</TableHead>
                <TableHead className="w-32">{m['myDelegations.table.status']()}</TableHead>
                <TableHead className="w-36">{m['myDelegations.table.created']()}</TableHead>
                <TableHead className="pe-4 w-24 text-right">{m['myDelegations.table.actions']()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {m['myDelegations.empty']()}
                  </TableCell>
                </TableRow>
              )}
              {pagedData.map((delegation: DelegationResponse) => (
                <TableRow key={delegation.id}>
                  <TableCell className="ps-4">
                    <div className="flex items-center gap-3">
                      {delegation.flag_url ? (
                        <img
                          src={delegation.flag_url}
                          alt={delegation.name}
                          className="h-8 w-8 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground text-sm font-semibold">
                          {delegation.name.charAt(0)}
                        </div>
                      )}
                      {delegation.league_id ? (
                        <Link
                          to="/leagues/$leagueId/delegations/$delegationId"
                          params={{ leagueId: String(delegation.league_id), delegationId: String(delegation.id) }}
                          className="font-medium hover:underline"
                        >
                          {delegation.name}
                        </Link>
                      ) : (
                        <Link
                          to="/delegations/$delegationId"
                          params={{ delegationId: String(delegation.id) }}
                          className="font-medium hover:underline"
                        >
                          {delegation.name}
                        </Link>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-muted-foreground text-xs">
                      {delegation.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("font-mono text-[10px]", statusVariant[delegation.status])}
                    >
                      {statusLabel[delegation.status] ?? delegation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-xs">
                      {new Date(delegation.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </TableCell>
                  <TableCell className="pe-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-full">
                        <DropdownMenuItem>
                          <Link
                            to="/my-delegations/$delegationId/edit"
                            params={{ delegationId: String(delegation.id) }}
                            className="flex items-center gap-2 w-full"
                          >
                            <Pencil className="size-3.5" />
                            {m['myDelegations.action.edit']()}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedDelegation(delegation);
                            setDialogOpen(true);
                          }}
                        >
                          <span className="flex items-center gap-2 w-full whitespace-nowrap">
                            <Hand className="size-3.5" />
                            {m['myDelegations.action.request']()}
                          </span>
                        </DropdownMenuItem>
                        {delegation.league_id ? (
                          <DropdownMenuItem>
                            <Link
                              to="/leagues/$leagueId/delegations/$delegationId"
                              params={{
                                leagueId: String(delegation.league_id),
                                delegationId: String(delegation.id),
                              }}
                              className="flex items-center gap-2 w-full"
                            >
                              <ExternalLink className="size-3.5" />
                              {m['myDelegations.action.view']()}
                            </Link>
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableLayout>
      </div>

      {selectedDelegation && (
        <RequestParticipationDialog
          delegation={selectedDelegation}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}

      <AIGenerateDialog open={aiDialogOpen} onOpenChange={setAiDialogOpen} />
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

function RequestParticipationDialog({
  delegation,
  open,
  onOpenChange,
}: {
  delegation: DelegationResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: leagues } = useSuspenseQuery(leagueListQueryOptions());
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");

  const mutation = useMutation({
    mutationFn: (leagueId: number) =>
      unwrap(
        client.POST("/delegations/{delegation_id}/participation-requests", {
          params: { path: { delegation_id: delegation.id } },
          body: { league_id: leagueId },
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.delegations.my() });
      toast.success(m['common.actions.create']());
      onOpenChange(false);
      setSelectedLeagueId("");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : m['delegation.form.alert.error']());
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{m['myDelegations.dialog.title']()}</DialogTitle>
          <DialogDescription>
            {m['myDelegations.card.controls.desc']()}{" "}
            <strong>{delegation.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={selectedLeagueId} onValueChange={(value) => setSelectedLeagueId(value ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder={m['myDelegations.selectLeague']()} />
            </SelectTrigger>
            <SelectContent>
              {leagues.map((league) => (
                <SelectItem key={league.id} value={String(league.id)}>
                  {league.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {m['common.actions.cancel']()}
          </Button>
          <Button
            disabled={!selectedLeagueId || mutation.isPending}
            onClick={() => mutation.mutate(Number(selectedLeagueId))}
          >
            {mutation.isPending ? m['competition.form.submitting']() : m['common.actions.submit']()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AIGenerateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content: m['myDelegations.card.controls.desc'](),
    },
  ]);
  const [input, setInput] = useState("");

  const mutation = useMutation({
    mutationFn: async (prompt: string) =>
      unwrap(
        client.POST("/delegations/ai-generate", {
          body: { prompt, count: 5 },
        }),
      ),
    onSuccess: async (created: DelegationResponse[]) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.delegations.my() });
      const names = created.map((d) => d.name).join(", ");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `${m['common.actions.create']()}: ${names}.`,
        },
      ]);
      toast.success(
        created.length === 1
          ? m['common.actions.create']()
          : `${created.length} ${m['common.actions.create']()}`,
      );
    },
    onError: (error) => {
      const msg = error instanceof ApiError ? error.message : m['delegation.form.alert.error']();
      setMessages((prev) => [...prev, { role: "assistant", content: `Erro: ${msg}` }]);
      toast.error(msg);
    },
  });

  const handleSend = () => {
    if (!input.trim() || mutation.isPending) return;
    const prompt = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setInput("");
    mutation.mutate(prompt);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="size-5" />
            {m['common.actions.create']()}
          </DialogTitle>
          <DialogDescription>
            {m['myDelegations.requestPlaceholder']()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-96 flex-col gap-3">
          <div className="flex-1 overflow-y-auto space-y-3 rounded-lg border bg-muted/30 p-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex max-w-[85%] flex-col gap-1 rounded-xl px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto bg-background border"
                )}
              >
                {msg.content}
              </div>
            ))}
            {mutation.isPending && (
              <div className="mr-auto flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm text-muted-foreground">
                <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                {m['competition.form.submitting']()}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={m['myDelegations.requestPlaceholder']()}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              disabled={mutation.isPending}
            />
            <Button size="sm" onClick={handleSend} disabled={!input.trim() || mutation.isPending}>
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
