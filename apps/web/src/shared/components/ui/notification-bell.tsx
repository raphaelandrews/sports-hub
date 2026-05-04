import { useState } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@sports-system/ui/components/button";
import { Badge } from "@sports-system/ui/components/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@sports-system/ui/components/popover";
import { ScrollArea } from "@sports-system/ui/components/scroll-area";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsQueryOptions } from "@/features/notifications/api/queries";
import { queryKeys } from "@/features/keys";
import { client, unwrap } from "@/shared/lib/api";
import { NotificationItem } from "@/features/notifications/components/notification-item";
import * as m from "@/paraglide/messages";

interface NotificationBellProps {
  userId: number;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    ...notificationsQueryOptions(userId),
    refetchInterval: open ? 10_000 : 30_000,
  });

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="relative inline-flex size-8 items-center justify-center rounded-md hover:bg-muted cursor-pointer">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] pointer-events-none"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 gap-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="text-sm font-semibold">{m["notification.panelTitle"]()}</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              {m["notification.markAllRead"]() }
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{m["notification.empty"]() }</p>
          ) : (
            notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notif={notif}
                onMarkRead={(id) => markReadMutation.mutate(id)}
                onClick={() => {
                  setOpen(false);
                  void router.navigate({ to: "/notifications" });
                }}
              />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
