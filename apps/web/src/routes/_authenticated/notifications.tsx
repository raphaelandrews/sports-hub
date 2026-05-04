import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@sports-system/ui/components/button";
import { ScrollArea } from "@sports-system/ui/components/scroll-area";

import { sessionQueryOptions } from "@/features/auth/api/queries";
import { notificationsQueryOptions } from "@/features/notifications/api/queries";
import { queryKeys } from "@/features/keys";
import { client, unwrap } from "@/shared/lib/api";
import { NotificationCard } from "@/features/notifications/components/notification-card";
import * as m from "@/paraglide/messages";
import { PageSingleLayout } from "@/shared/components/layouts/page-single-layout";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSuspenseQuery(sessionQueryOptions());
  const userId = session.id;

  const { data } = useSuspenseQuery(notificationsQueryOptions(userId));
  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markReadMutation = useMutation({
    mutationFn: (notifId: number) =>
      unwrap(
        client.PATCH("/users/notifications/{notification_id}/read", {
          params: { path: { notification_id: notifId } },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(userId),
      });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => unwrap(client.PATCH("/users/notifications/read-all")),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(userId),
      });
    },
  });

  return (
    <PageSingleLayout
      title={m["notification.pageTitle"]()}
      description={m["notification.pageDescription"]()}
      helperButton={
        unreadCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            {m["notification.markAllRead"]()}
          </Button>
        ) : undefined
      }
    >
      <ScrollArea className="max-h-[70vh]">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {m["notification.empty"]()}
          </p>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <NotificationCard
                key={notif.id}
                notif={notif}
                onMarkRead={(id) => markReadMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </PageSingleLayout>
  );
}
