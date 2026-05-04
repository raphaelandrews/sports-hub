import { BellIcon } from "lucide-react";
import { Button } from "@sports-system/ui/components/button";
import { client, unwrap } from "@/shared/lib/api";
import { formatEventDate } from "@/shared/lib/date";
import type { InvitePayload, NotificationResponse, NotificationType } from "@/types/notifications";
import * as m from "@/paraglide/messages";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function notifTitle(type: NotificationType): string {
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

function notifDescription(notif: NotificationResponse): string {
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

interface NotificationCardProps {
  notif: NotificationResponse;
  onMarkRead: (id: number) => void;
}

export function NotificationCard({ notif, onMarkRead }: NotificationCardProps) {
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
      className={`overflow-hidden rounded-[20px] bg-card transition-all duration-300 ease-out scale-100 opacity-100 ${!notif.read ? "ring-1 ring-red-500/20" : ""}`}
      onClick={() => {
        if (!notif.read) {
          onMarkRead(notif.id);
        }
      }}
    >
      <div className="flex w-full cursor-pointer items-start gap-3 px-4 py-4 text-left transition-all duration-300 ease-out hover:bg-input/50 bg-transparent">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
          <BellIcon size={16} className="text-red-400" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{notifTitle(notif.notification_type)}</p>
            {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notifDescription(notif)}</p>
          <p className="mt-1 text-xs text-muted-foreground/60">{formatEventDate(notif.created_at)}</p>
          
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
      </div>
    </div>
  );
}
