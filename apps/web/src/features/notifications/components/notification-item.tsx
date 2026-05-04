import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@sports-system/ui/components/button";
import { client, unwrap } from "@/shared/lib/api";
import { formatEventDate } from "@/shared/lib/date";
import type { InvitePayload, NotificationResponse, NotificationType } from "@/types/notifications";
import * as m from "@/paraglide/messages";

export function notifTitle(type: NotificationType): string {
  switch (type) {
    case "INVITE":
      return m["notification.title.invite"]();
    case "REQUEST_REVIEWED":
      return m["notification.title.requestReviewed"]();
    case "MATCH_REMINDER":
      return m["notification.title.matchReminder"]();
    case "RESULT":
      return m["notification.title.result"]();
    case "TRANSFER":
      return m["notification.title.transfer"]();
    case "PARTICIPATION_REQUEST":
      return m["notification.title.participation"]();
  }
}

export function notifDescription(notif: NotificationResponse): string {
  const p = notif.payload;
  switch (notif.notification_type) {
    case "INVITE":
      return `${m["notification.desc.invite"]() } ${p.delegation_name as string}`;
    case "REQUEST_REVIEWED":
      return p.status === "APPROVED"
        ? `${m["notification.desc.requestApproved"]() } ${p.delegation_name as string}`
        : `${m["notification.desc.requestRejected"]() } ${p.delegation_name as string}`;
    case "MATCH_REMINDER":
      return `${m["notification.desc.matchReminderPrefix"]() } ${p.event_name as string} ${m["notification.desc.matchReminderSuffix"]() }`;
    case "RESULT":
      return `${m["notification.desc.resultPrefix"]() } ${p.event_name as string} ${m["notification.desc.resultSuffix"]() }`;
    case "TRANSFER":
      return p.status === "ACCEPTED"
        ? `${m["notification.desc.transferPrefix"]() } ${p.delegation_name as string} ${m["notification.desc.transferAccepted"]() }`
        : `${m["notification.desc.transferPrefix"]() } ${p.delegation_name as string} ${m["notification.desc.transferRefused"]() }`;
    case "PARTICIPATION_REQUEST":
      return `${m["notification.desc.participationPrefix"]() } ${p.delegation_name as string} ${m["notification.desc.participationMid"]() } ${p.league_name as string}`;
    default:
      return "";
  }
}

interface NotificationItemProps {
  notif: NotificationResponse;
  onMarkRead: (id: number) => void;
  onClick?: () => void;
}

export function NotificationItem({ notif, onMarkRead, onClick }: NotificationItemProps) {
  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: (inviteId: number) =>
      unwrap(
        client.POST("/invites/{invite_id}/accept", { params: { path: { invite_id: inviteId } } }),
      ),
    onSuccess: () => {
      onMarkRead(notif.id);
      void queryClient.invalidateQueries({
        queryKey: ["delegations"],
      });
    },
  });

  const refuseMutation = useMutation({
    mutationFn: (inviteId: number) =>
      unwrap(
        client.POST("/invites/{invite_id}/refuse", { params: { path: { invite_id: inviteId } } }),
      ),
    onSuccess: () => onMarkRead(notif.id),
  });

  const isInvite = notif.notification_type === "INVITE";
  const invitePayload = notif.payload as unknown as InvitePayload;

  return (
    <div
      className={`px-4 py-3 border-b last:border-0 transition-colors ${!notif.read ? "bg-muted/40" : ""} ${onClick ? "cursor-pointer hover:bg-muted/60" : ""}`}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-none">{notifTitle(notif.notification_type)}</p>
          <p className="text-xs text-muted-foreground mt-1">{notifDescription(notif)}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {formatEventDate(notif.created_at)}
          </p>
        </div>
        {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />}
      </div>
      {isInvite && !notif.read && (
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            className="h-7 text-xs px-3"
            onClick={(e) => {
              e.stopPropagation();
              acceptMutation.mutate(invitePayload.invite_id);
            }}
            disabled={acceptMutation.isPending || refuseMutation.isPending}
          >
            {m["notification.action.accept"]() }
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-3"
            onClick={(e) => {
              e.stopPropagation();
              refuseMutation.mutate(invitePayload.invite_id);
            }}
            disabled={acceptMutation.isPending || refuseMutation.isPending}
          >
            {m["notification.action.refuse"]() }
          </Button>
        </div>
      )}
    </div>
  );
}
