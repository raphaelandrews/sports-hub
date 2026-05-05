import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import * as m from "@/paraglide/messages";
import { leagueListQueryOptions } from "@/features/leagues/api/queries";
import { Title } from "@/shared/components/ui/title";
import { PageAsideLayout } from "@/shared/components/layouts/page-aside-layout";
import { LeaguesSidebar } from "@/shared/components/ui/leagues-sidebar";
import { globalActivityFeedQueryOptions } from "@/features/activities";
import { HomeCharts } from "@/features/home/components/home-charts";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(leagueListQueryOptions()),
      queryClient.ensureQueryData(globalActivityFeedQueryOptions(10)),
    ]),
  component: HomePage,
});

function HomePage() {
  const { data: leagues } = useSuspenseQuery(leagueListQueryOptions());
  const { data: feedItems } = useSuspenseQuery(globalActivityFeedQueryOptions(10));

  return (
    <PageAsideLayout sidebar={<LeaguesSidebar leagues={leagues} feedItems={feedItems} />}>
      <Title title={m['home.title']()} description={m['home.subtitle']()} />
      <HomeCharts leagues={leagues} feedItems={feedItems} />
    </PageAsideLayout>
  );
}
