import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@sports-system/ui/components/card";
import { EvilBarChart } from "@/components/evilcharts/charts/bar-chart";
import { EvilPieChart } from "@/components/evilcharts/charts/pie-chart";
import { leagueListQueryOptions } from "@/features/leagues/api/queries";
import * as m from "@/paraglide/messages";

export function HomeCharts() {
  const { data: leagues } = useSuspenseQuery(leagueListQueryOptions());

  // Top 5 leagues by members
  const topLeagues = [...leagues]
    .sort((a, b) => b.member_count - a.member_count)
    .slice(0, 5)
    .map((league) => ({
      name: league.name.length > 20 ? league.name.slice(0, 20) + "..." : league.name,
      members: league.member_count,
    }));

  const topLeaguesConfig = {
    members: {
      label: m["league.card.members"](),
      colors: {
        light: ["var(--primary)"],
        dark: ["var(--primary)"],
      },
    },
  };

  // League status breakdown
  const statusCounts = leagues.reduce(
    (acc, league) => {
      acc[league.status] = (acc[league.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status: status === "ACTIVE" ? m["common.status.active"]() : m["common.status.inactive"](),
    count,
  }));

  const statusConfig = {
    [m["common.status.active"]()]: {
      label: m["common.status.active"](),
      colors: {
        light: ["var(--primary)"],
        dark: ["var(--primary)"],
      },
    },
    [m["common.status.inactive"]()]: {
      label: m["common.status.inactive"](),
      colors: {
        light: ["var(--muted-foreground)"],
        dark: ["var(--muted-foreground)"],
      },
    },
  };

  // League creation timeline (last 6 months)
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  
  const monthLabels: string[] = [];
  const monthCounts: Record<string, number> = {};
  
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
    const key = d.toISOString().slice(0, 7); // YYYY-MM
    monthLabels.push(key);
    monthCounts[key] = 0;
  }

  leagues.forEach((league) => {
    const key = league.created_at.slice(0, 7);
    if (monthCounts[key] !== undefined) {
      monthCounts[key]++;
    }
  });

  const timelineData = monthLabels.map((key) => ({
    month: new Date(key + "-01").toLocaleDateString(undefined, { month: "short" }),
    leagues: monthCounts[key],
  }));

  const timelineConfig = {
    leagues: {
      label: m["leagues.listTitle"](),
      colors: {
        light: ["var(--chart-1)"],
        dark: ["var(--chart-1)"],
      },
    },
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{m["home.charts.topLeagues"]()}</CardTitle>
        </CardHeader>
        <CardContent>
          <EvilBarChart
            chartConfig={topLeaguesConfig}
            data={topLeagues}
            xDataKey="name"
            yDataKey="members"
            layout="horizontal"
            hideCartesianGrid
            hideLegend
            barRadius={4}
            className="h-[200px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{m["home.charts.statusBreakdown"]()}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <EvilPieChart
            chartConfig={statusConfig}
            data={statusData}
            dataKey="count"
            nameKey="status"
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={2}
            hideLegend={false}
            className="h-[200px] w-[200px]"
          />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{m["home.charts.creationTimeline"]()}</CardTitle>
        </CardHeader>
        <CardContent>
          <EvilBarChart
            chartConfig={timelineConfig}
            data={timelineData}
            xDataKey="month"
            yDataKey="leagues"
            hideCartesianGrid
            hideLegend
            barRadius={4}
            className="h-[200px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}
