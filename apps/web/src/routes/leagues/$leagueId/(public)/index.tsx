import { useState } from "react";
import { Badge } from "@sports-system/ui/components/badge";
import { Button } from "@sports-system/ui/components/button";
import { Input } from "@sports-system/ui/components/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@sports-system/ui/components/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@sports-system/ui/components/card";
import { useSuspenseQuery } from "@tanstack/react-query";
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
} from "lucide-react";

import { allEventsQueryOptions } from "@/features/events/api/queries";
import { leagueDetailQueryOptions } from "@/features/leagues/api/queries";
import { useGenerateResumeMutation } from "@/features/narratives/api/queries";
import { client, unwrap } from "@/shared/lib/api";
import { MarkdownRenderer } from "@/shared/components/ui/markdown-renderer";
import { seoMeta } from "@/shared/lib/seo";

export const Route = createFileRoute("/leagues/$leagueId/(public)/")({
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    queryClient.ensureQueryData(leagueDetailQueryOptions(leagueId)),
  head: ({ loaderData }) =>
    seoMeta({
      title: loaderData?.name ?? "Liga",
      description: loaderData?.description || loaderData?.slug || "",
    }),
  component: LeaguePublicPage,
});

function LeaguePublicPage() {
  const { leagueId } = Route.useParams();
  const { data: league } = useSuspenseQuery(leagueDetailQueryOptions(leagueId));
  const { data: upcomingEvents } = useSuspenseQuery(
    allEventsQueryOptions(Number(leagueId), { per_page: 5 }),
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
    {
      to: "/leagues/$leagueId/results" as const,
      label: "Resultados",
      desc: "Quadro de medalhas e rankings",
      icon: Trophy,
    },
    {
      to: "/leagues/$leagueId/calendar" as const,
      label: "Calendário",
      desc: "Agenda de eventos e competições",
      icon: Calendar,
    },
    {
      to: "/leagues/$leagueId/delegations" as const,
      label: "Delegações",
      desc: "Delegações participantes",
      icon: Users,
    },
    {
      to: "/leagues/$leagueId/sports" as const,
      label: "Esportes",
      desc: "Modalidades e chaveamentos",
      icon: Dumbbell,
    },
    {
      to: "/leagues/$leagueId/competitions" as const,
      label: "Competições",
      desc: "Resumo por competição",
      icon: ClipboardList,
    },
    {
      to: "/leagues/$leagueId/feed" as const,
      label: "Feed",
      desc: "Atividades recentes",
      icon: Newspaper,
    },
    {
      to: "/leagues/$leagueId/report" as const,
      label: "Relatório",
      desc: "Relatório final consolidado",
      icon: BarChart3,
    },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <section className="mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          {league.status === "ACTIVE" ? (
            <Badge variant="secondary">Ativa</Badge>
          ) : (
            <Badge variant="destructive">Inativa</Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 rounded-xl">
            <AvatarImage src={league.logo_url ?? ""} alt={league.name} />
            <AvatarFallback className="rounded-xl bg-primary text-primary-foreground text-xl">
              {league.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{league.name}</h1>
            <p className="text-muted-foreground mt-1 text-lg">{league.slug}</p>
          </div>
        </div>
        {league.description && (
          <p className="mt-4 max-w-3xl text-muted-foreground">{league.description}</p>
        )}
      </section>

      <section className="mb-8">
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">Resumo da Liga</CardTitle>
                <CardDescription className="text-sm">
                  Gere um resumo editorial com IA sobre o estado atual da competição
                </CardDescription>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generateResume.isPending}
                size="sm"
              >
                {generateResume.isPending ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="size-4 mr-2" />
                )}
                Gerar resumo
              </Button>
            </div>
          </CardHeader>
          {resumeContent && (
            <CardContent>
              <MarkdownRenderer content={resumeContent} />
            </CardContent>
          )}
        </Card>
      </section>

      <section className="mb-8">
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <MessageCircleQuestion className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">Assistente IA</CardTitle>
                <CardDescription className="text-sm">
                  Pergunte qualquer coisa sobre estatísticas, medalhas, partidas e delegações
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Qual delegação tem mais medalhas de ouro?"
                value={assistantQuestion}
                onChange={(event) => setAssistantQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleAssistantAsk();
                }}
              />
              <Button
                onClick={handleAssistantAsk}
                disabled={assistantLoading || !assistantQuestion.trim()}
                size="sm"
              >
                {assistantLoading ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <MessageCircleQuestion className="size-4 mr-2" />
                )}
                Perguntar
              </Button>
            </div>
            {assistantAnswer && (
              <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
                <MarkdownRenderer content={assistantAnswer} />
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mb-8">
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">Previsões IA</CardTitle>
                <CardDescription className="text-sm">
                  Gere previsões de resultado com base no histórico das equipes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents && upcomingEvents.data.length > 0 ? (
              upcomingEvents.data.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/15 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {event.event_date} às {event.start_time}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {event.venue || "Local a definir"} · {event.phase}
                    </div>
                  </div>
                  <Link
                    to="/leagues/$leagueId/competitions/$competitionId"
                    params={{ leagueId, competitionId: String(event.competition_id) }}
                  >
                    <Button variant="outline" size="sm">
                      Ver partidas
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                Nenhum evento próximo. Acesse o calendário para ver todas as partidas.
              </div>
            )}
            <div className="flex justify-end">
              <Link to="/leagues/$leagueId/calendar" params={{ leagueId }}>
                <Button variant="ghost" size="sm">Ver calendário completo</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} params={{ leagueId }} className="block">
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.label}</CardTitle>
                      <CardDescription className="text-sm">{item.desc}</CardDescription>
                    </div>
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
