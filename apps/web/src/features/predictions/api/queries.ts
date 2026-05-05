import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

export const matchPredictionQueryOptions = (leagueId: number, matchId: number) =>
  queryOptions({
    queryKey: queryKeys.predictions.detail(matchId),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/matches/{match_id}/prediction", {
          params: { path: { league_id: leagueId, match_id: matchId } },
        }),
      ),
    staleTime: 5 * 60 * 1000,
  });

export async function generateMatchPrediction(leagueId: number, matchId: number) {
  return unwrap(
    client.POST("/leagues/{league_id}/matches/{match_id}/predict", {
      params: { path: { league_id: leagueId, match_id: matchId } },
    }),
  );
}
