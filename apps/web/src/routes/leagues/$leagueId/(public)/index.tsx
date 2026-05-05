import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@sports-system/ui/components/badge";
import { Button } from "@sports-system/ui/components/button";
import { Input } from "@sports-system/ui/components/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@sports-system/ui/components/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@sports-system/ui/components/card";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Trophy,
  Calendar,
  Users,
  Dumbbell,
  BarChart3,
  Newspaper,
  ClipboardList,
  Sparkles,
  Loader2,
  MessageCircleQuestion,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Eye,
  Bot,
  Send,
} from "lucide-react";

import { allEventsQueryOptions } from "@/features/events/api/queries";
import { leagueDetailQueryOptions } from "@/features/leagues/api/queries";
import { useGenerateResumeMutation } from "@/features/narratives/api/queries";
import { sportListQueryOptions } from "@/features/sports/api/queries";
import { delegationListQueryOptions } from "@/features/delegations/api/queries";
import { competitionListQueryOptions } from "@/features/competitions/api/queries";
import { athleteListQueryOptions } from "@/features/athletes/api/queries";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { MarkdownRenderer } from "@/shared/components/ui/markdown-renderer";
import { queryKeys } from "@/features/keys";
import { seoMeta } from "@/shared/lib/seo";
import type { SportResponse } from "@/types/sports";
import type { DelegationResponse } from "@/types/delegations";
import type { CompetitionResponse } from "@/types/competitions";
import type { EventResponse } from "@/types/events";

export const Route = createFileRoute("/leagues/$leagueId/(public)/")({
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    Promise.all([
      queryClient.ensureQueryData(leagueDetailQueryOptions(leagueId)),
      queryClient.ensureQueryData(sportListQueryOptions()),
      queryClient.ensureQueryData(delegationListQueryOptions(Number(leagueId))),
      queryClient.ensureQueryData(competitionListQueryOptions(Number(leagueId))),
      queryClient.ensureQueryData(
        allEventsQueryOptions(Number(leagueId), { per_page: 100 }),
      ),
    ]),
  head: ({ loaderData }) => {
    const league = Array.isArray(loaderData) ? loaderData[0] : loaderData;
    return seoMeta({
      title: league?.name ?? "Liga",
      description: league?.description || league?.slug || "",
    });
  },
  component: LeaguePublicPage,
});

function LeaguePublicPage() {
  const { leagueId } = Route.useParams();
  const { session } = Route.useRouteContext();
  const { data: league } = useSuspenseQuery(leagueDetailQueryOptions(leagueId));
  const isAdmin = session?.role === "ADMIN" || session?.role === "SUPERADMIN" || (session != null && league.created_by_id === session.id);
  const queryClient = useQueryClient();

  const { data: sports } = useSuspenseQuery(sportListQueryOptions());
  const { data: delegations } = useSuspenseQuery(
    delegationListQueryOptions(Number(leagueId)),
  );
  const { data: competitions } = useSuspenseQuery(
    competitionListQueryOptions(Number(leagueId)),
  );
  const { data: athletes } = useSuspenseQuery(
    athleteListQueryOptions(Number(leagueId)),
  );
  const { data: events } = useSuspenseQuery(
    allEventsQueryOptions(Number(leagueId), { per_page: 100 }),
  );

  const [resumeContent, setResumeContent] = useState<string | null>(null);
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState<string | null>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const generateResume = useGenerateResumeMutation(Number(leagueId));

  const handleGenerate = () => {
    generateResume.mutate(undefined, {
      onSuccess: (data) => {
        setResumeContent(data.content);
      },
    });
  };

  const handleAssistantAsk = () => {
    if (!assistantQuestion.trim()) return;
    setAssistantLoading(true);
    unwrap(
      client.POST("/leagues/{league_id}/assistant/query", {
        params: { path: { league_id: Number(leagueId) } },
        body: { question: assistantQuestion.trim() },
      }),
    )
      .then((data) => setAssistantAnswer(data.answer))
      .catch(() => setAssistantAnswer("Erro ao consultar o assistente."))
      .finally(() => setAssistantLoading(false));
  };

  const navItems = [
    { to: "/leagues/$leagueId/results" as const, label: "Resultados", desc: "Quadro de medalhas e rankings", icon: Trophy },
    { to: "/leagues/$leagueId/calendar" as const, label: "Calendário", desc: "Agenda de eventos e competições", icon: Calendar },
    { to: "/leagues/$leagueId/delegations" as const, label: "Delegações", desc: "Delegações participantes", icon: Users },
    { to: "/leagues/$leagueId/sports" as const, label: "Esportes", desc: "Modalidades e chaveamentos", icon: Dumbbell },
    { to: "/leagues/$leagueId/competitions" as const, label: "Competições", desc: "Resumo por competição", icon: ClipboardList },
    { to: "/leagues/$leagueId/feed" as const, label: "Feed", desc: "Atividades recentes", icon: Newspaper },
    { to: "/leagues/$leagueId/report" as const, label: "Relatório", desc: "Relatório final consolidado", icon: BarChart3 },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <section className="mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          {league.status === "ACTIVE" ? <Badge variant="secondary">Ativa</Badge> : <Badge variant="destructive">Inativa</Badge>}
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 rounded-xl">
            <AvatarImage src={league.logo_url ?? ""} alt={league.name} />
            <AvatarFallback className="rounded-xl bg-primary text-primary-foreground text-xl">{league.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{league.name}</h1>
            <p className="text-muted-foreground mt-1 text-lg">{league.slug}</p>
          </div>
        </div>
        {league.description && <p className="mt-4 max-w-3xl text-muted-foreground">{league.description}</p>}
      </section>

      <section className="mb-8">
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10"><Sparkles className="size-5 text-primary" /></div>
              <div className="flex-1">
                <CardTitle className="text-base">Resumo da Liga</CardTitle>
                <CardDescription className="text-sm">Gere um resumo editorial com IA sobre o estado atual da competição</CardDescription>
              </div>
              <Button onClick={handleGenerate} disabled={generateResume.isPending} size="sm">
                {generateResume.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
                Gerar resumo
              </Button>
            </div>
          </CardHeader>
          {resumeContent && <CardContent><MarkdownRenderer content={resumeContent} /></CardContent>}
        </Card>
      </section>

      <section className="mb-8">
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10"><MessageCircleQuestion className="size-5 text-primary" /></div>
              <div className="flex-1">
                <CardTitle className="text-base">Assistente IA</CardTitle>
                <CardDescription className="text-sm">Pergunte qualquer coisa sobre estatísticas, medalhas, partidas e delegações</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Ex: Qual delegação tem mais medalhas de ouro?" value={assistantQuestion} onChange={(event) => setAssistantQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") handleAssistantAsk(); }} />
              <Button onClick={handleAssistantAsk} disabled={assistantLoading || !assistantQuestion.trim()} size="sm">
                {assistantLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <MessageCircleQuestion className="size-4 mr-2" />}
                Perguntar
              </Button>
            </div>
            {assistantAnswer && <div className="rounded-2xl border border-border/70 bg-muted/15 p-4"><MarkdownRenderer content={assistantAnswer} /></div>}
          </CardContent>
        </Card>
      </section>

      {isAdmin && (
        <section className="mb-8">
          <WorkflowGenerator
            leagueId={Number(leagueId)}
            sports={sports.data}
            delegations={delegations.data}
            athletes={athletes?.data ?? []}
            competitions={competitions.data}
            events={events?.data ?? []}
            onInvalidate={() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.sports.all() });
              queryClient.invalidateQueries({ queryKey: queryKeys.delegations.all(Number(leagueId)) });
              queryClient.invalidateQueries({ queryKey: queryKeys.athletes.all(Number(leagueId)) });
              queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all(Number(leagueId)) });
              queryClient.invalidateQueries({ queryKey: queryKeys.events.all(Number(leagueId)) });
            }}
          />
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} params={{ leagueId }} className="block">
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10"><Icon className="size-5 text-primary" /></div>
                    <div><CardTitle className="text-base">{item.label}</CardTitle><CardDescription className="text-sm">{item.desc}</CardDescription></div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function WorkflowGenerator({
  leagueId,
  sports,
  delegations,
  athletes,
  competitions,
  events,
  onInvalidate,
}: {
  leagueId: number;
  sports: SportResponse[];
  delegations: DelegationResponse[];
  athletes: { id: number; name: string }[];
  competitions: CompetitionResponse[];
  events: EventResponse[];
  onInvalidate: () => void;
}) {
  const [generatingStep, setGeneratingStep] = useState<number | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [compFormOpen, setCompFormOpen] = useState(false);
  const [compStart, setCompStart] = useState("");
  const [compEnd, setCompEnd] = useState("");
  const [compSubmitting, setCompSubmitting] = useState(false);
  const [selectedCompForCalendar, setSelectedCompForCalendar] = useState<number | null>(null);
  const [calendarGenerating, setCalendarGenerating] = useState(false);
  const [generatedNarrative, setGeneratedNarrative] = useState<string | null>(null);
  const [delegationChatOpen, setDelegationChatOpen] = useState(false);
  const [delegationChatInput, setDelegationChatInput] = useState("");
  const [delegationChatLoading, setDelegationChatLoading] = useState(false);

  const generate = async (step: number, fn: () => Promise<unknown>) => {
    setGeneratingStep(step);
    try {
      await fn();
      onInvalidate();
      toast.success(`Passo ${step} gerado com sucesso!`);
    } catch (err) {
      console.error(err);
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro no passo ${step}: ${message}`);
    } finally {
      setGeneratingStep(null);
    }
  };

  const createCompetition = async () => {
    if (!compStart || !compEnd) return;
    setCompSubmitting(true);
    try {
      await unwrap(client.POST("/leagues/{league_id}/competitions", {
        params: { path: { league_id: leagueId } },
        body: { start_date: compStart, end_date: compEnd, number: competitions.length + 1, sport_focus: [] },
      }));
      setCompFormOpen(false);
      onInvalidate();
      toast.success("Competição criada com sucesso!");
    } catch (err) {
      console.error(err);
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro ao criar competição: ${message}`);
    } finally {
      setCompSubmitting(false);
    }
  };

  const generateCalendar = async () => {
    if (!selectedCompForCalendar) return;
    setCalendarGenerating(true);
    try {
      await unwrap(client.POST("/leagues/{league_id}/events/ai-generate", {
        params: { path: { league_id: leagueId }, query: { competition_id: selectedCompForCalendar } },
      }));
      setSelectedCompForCalendar(null);
      onInvalidate();
      toast.success("Calendário gerado com sucesso!");
    } catch (err) {
      console.error(err);
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro ao gerar calendário: ${message}`);
    } finally {
      setCalendarGenerating(false);
    }
  };

  const generateNarrative = async () => {
    setGeneratingStep(7);
    try {
      const data = await unwrap(client.POST("/leagues/{league_id}/narrative/generate", {
        params: { path: { league_id: leagueId }, query: { target_date: new Date().toISOString().slice(0, 10) } },
      }));
      setGeneratedNarrative(data.content || "Narrativa gerada com sucesso!");
      onInvalidate();
      toast.success("Narrativa gerada com sucesso!");
    } catch (err) {
      console.error(err);
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro ao gerar narrativa: ${message}`);
    } finally {
      setGeneratingStep(null);
    }
  };

  const generateDelegationsWithTheme = async () => {
    if (!delegationChatInput.trim()) return;
    setDelegationChatLoading(true);
    try {
      await unwrap(
        client.POST("/leagues/{league_id}/delegations/ai-generate", {
          params: { path: { league_id: leagueId }, query: { count: 5 } },
        }),
      );
      setDelegationChatInput("");
      setDelegationChatOpen(false);
      onInvalidate();
      toast.success("Delegações geradas com sucesso!");
    } catch (err) {
      console.error(err);
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro ao gerar delegações: ${message}`);
    } finally {
      setDelegationChatLoading(false);
    }
  };

  const steps = [
    {
      title: "Esportes & Modalidades",
      desc: "Gere esportes e modalidades com IA",
      count: sports.length,
      items: sports.slice(0, 5).map((s) => s.name),
      action: async () => generate(1, () => unwrap(client.POST("/sports/ai-generate", { params: { query: { count: 3 } } }))),
      canGenerate: true,
    },
    {
      title: "Delegações",
      desc: "Crie delegações participantes com IA",
      count: delegations.length,
      items: delegations.slice(0, 5).map((d) => d.name),
      action: async () => generate(2, () => unwrap(client.POST("/leagues/{league_id}/delegations/ai-generate", { params: { path: { league_id: leagueId }, query: { count: 5 } } }))),
      canGenerate: true,
      chatPlaceholder: "Descreva o tema das delegações (ex: times de futebol brasileiros, faculdades de SP...)",
      onChatSubmit: generateDelegationsWithTheme,
    },
    {
      title: "Atletas",
      desc: "Gere atletas para as delegações",
      count: athletes.length,
      items: athletes.slice(0, 5).map((a) => a.name),
      action: async () => generate(3, () => unwrap(client.POST("/leagues/{league_id}/athletes/ai-generate", { params: { path: { league_id: leagueId } } }))),
      canGenerate: true,
    },
    {
      title: "Competições",
      desc: "Crie um período de competição",
      count: competitions.length,
      items: competitions.map((c) => `Competição #${c.number} (${c.start_date} a ${c.end_date})`),
      customUI: compFormOpen ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Input type="date" value={compStart} onChange={(e) => setCompStart(e.target.value)} className="w-40" />
          <Input type="date" value={compEnd} onChange={(e) => setCompEnd(e.target.value)} className="w-40" />
          <Button size="sm" disabled={!compStart || !compEnd || compSubmitting} onClick={createCompetition}>
            {compSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Criar"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCompFormOpen(false)}>Cancelar</Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="mt-3" onClick={() => setCompFormOpen(true)}>
          <Sparkles className="size-4 mr-2" /> Criar competição
        </Button>
      ),
      canGenerate: false,
    },
    {
      title: "Calendário de Eventos",
      desc: "Gere jogos para uma competição",
      count: events.length,
      items: events.slice(0, 5).map((e) => `${e.event_date} ${e.start_time}`),
      customUI: competitions.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-2">Crie uma competição primeiro.</p>
      ) : selectedCompForCalendar ? (
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={selectedCompForCalendar}
            onChange={(e) => setSelectedCompForCalendar(Number(e.target.value))}
          >
            {competitions.map((c) => <option key={c.id} value={c.id}>Competição #{c.number}</option>)}
          </select>
          <Button size="sm" disabled={calendarGenerating} onClick={generateCalendar}>
            {calendarGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4 mr-2" />}
            Gerar calendário
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedCompForCalendar(null)}>Cancelar</Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="mt-3" onClick={() => setSelectedCompForCalendar(competitions[0]?.id ?? null)}>
          <Sparkles className="size-4 mr-2" /> Gerar calendário
        </Button>
      ),
      canGenerate: false,
    },
    {
      title: "Inscrições",
      desc: "Inscreva atletas automaticamente",
      count: 0,
      items: [],
      action: async () => generate(6, () => unwrap(client.POST("/leagues/{league_id}/enrollments/ai-generate", { params: { path: { league_id: leagueId } } }))),
      canGenerate: true,
    },
    {
      title: "Conteúdo & Narrativas",
      desc: "Gere narrativa do dia",
      count: generatedNarrative ? 1 : 0,
      items: generatedNarrative ? ["Narrativa gerada"] : [],
      action: generateNarrative,
      canGenerate: true,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10"><Sparkles className="size-5 text-primary" /></div>
          <div>
            <CardTitle className="text-base">Workflow de Geração com IA</CardTitle>
            <CardDescription className="text-sm">Gere todo o conteúdo da liga sem sair desta página</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isDone = step.count > 0;
          const isExpanded = expandedStep === stepNum;

          return (
            <div key={stepNum} className="rounded-2xl border border-border/70 bg-muted/15 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {isDone ? <CheckCircle2 className="size-5 text-emerald-500" /> : <Circle className="size-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{stepNum}. {step.title}</span>
                    {step.count > 0 && <Badge variant="secondary" className="text-[10px]">{step.count} criados</Badge>}
                    {isDone && <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-700 dark:text-emerald-400">Concluído</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>

                  {step.canGenerate && (
                    <div className="mt-2 flex items-center gap-2">
                      <Button size="sm" variant="outline" disabled={generatingStep === stepNum} onClick={step.action}>
                        {generatingStep === stepNum ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
                        {generatingStep === stepNum ? "Gerando..." : isDone ? "Gerar mais" : "Gerar com IA"}
                      </Button>
                      {step.count > 0 && (
                        <Button size="sm" variant="ghost" onClick={() => setExpandedStep(isExpanded ? null : stepNum)}>
                          <Eye className="size-4 mr-2" />
                          {isExpanded ? "Ocultar" : "Ver gerados"}
                          {isExpanded ? <ChevronUp className="size-3 ml-1" /> : <ChevronDown className="size-3 ml-1" />}
                        </Button>
                      )}
                    </div>
                  )}

                  {stepNum === 2 && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDelegationChatOpen((o) => !o)}
                        disabled={delegationChatLoading}
                      >
                        <Bot className="size-4 mr-2" />
                        {delegationChatOpen ? "Fechar chat" : "Gerar com tema"}
                      </Button>
                      {delegationChatOpen && (
                        <div className="mt-2 flex gap-2">
                          <Input
                            placeholder={step.chatPlaceholder}
                            value={delegationChatInput}
                            onChange={(e) => setDelegationChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && generateDelegationsWithTheme()}
                            disabled={delegationChatLoading}
                          />
                          <Button size="sm" disabled={!delegationChatInput.trim() || delegationChatLoading} onClick={generateDelegationsWithTheme}>
                            {delegationChatLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {step.customUI}

                  {isExpanded && step.items.length > 0 && (
                    <div className="mt-3 rounded-xl border bg-background p-3">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground mb-2">Itens gerados</p>
                      <ul className="space-y-1">
                        {step.items.map((item, i) => (
                          <li key={i} className="text-sm flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-primary/60" />
                            {item}
                          </li>
                        ))}
                        {step.count > step.items.length && (
                          <li className="text-xs text-muted-foreground">...e mais {step.count - step.items.length}</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {stepNum === 7 && generatedNarrative && (
                    <div className="mt-3 rounded-xl border bg-background p-3">
                      <MarkdownRenderer content={generatedNarrative} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
