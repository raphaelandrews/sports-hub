import { Card, CardContent, CardHeader, CardTitle } from "@sports-system/ui/components/card";
import type { ActivityFeedItem } from "@sports-system/contracts/activities";
import type { components } from "@/types/api.gen";

import { LeagueGrowthAreaChart } from "./charts/league-growth-area-chart";
import { ActivityTimelineLineChart } from "./charts/activity-timeline-line-chart";
import { ActivityTypesBarChart } from "./charts/activity-types-bar-chart";
import { MonthlyLeaguesComposedChart } from "./charts/monthly-leagues-composed-chart";
import { ActivityBySportRadarChart } from "./charts/activity-by-sport-radar-chart";

type League = components["schemas"]["LeagueResponse"];

interface HomeChartsProps {
  leagues: League[];
  feedItems: ActivityFeedItem[];
}

export function HomeCharts({ leagues, feedItems }: HomeChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">League Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <LeagueGrowthAreaChart leagues={leagues} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimelineLineChart feedItems={feedItems} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Activity Types</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTypesBarChart feedItems={feedItems} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Leagues & Members by Month</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyLeaguesComposedChart leagues={leagues} />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Activity by Sport</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ActivityBySportRadarChart feedItems={feedItems} />
        </CardContent>
      </Card>
    </div>
  );
}
