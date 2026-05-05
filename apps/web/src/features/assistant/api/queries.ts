import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

export const assistantQueryOptions = (leagueId: number, question: string) =>
  queryOptions({
    queryKey: [...queryKeys.assistant.query(leagueId), question],
    queryFn: () =>
      unwrap(
        client.POST("/leagues/{league_id}/assistant/query", {
          params: { path: { league_id: leagueId } },
          body: { question },
        }),
      ),
    enabled: question.length > 0,
  });
