import { trpc } from "@/lib/trpc";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export default function NotificationDropdown() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: notifications = [] } = trpc.user.getNotifications.useQuery(
    { limit: 20 },
    { enabled: isAuthenticated, refetchInterval: 30000 }
  );
  const { data: unreadCount = 0 } = trpc.user.getUnreadCount.useQuery(
    undefined,
    { enabled: isAuthenticated, refetchInterval: 30000 }
  );

  const markRead = trpc.user.markRead.useMutation({
    onSuccess: () => {
      utils.user.getNotifications.invalidate();
      utils.user.getUnreadCount.invalidate();
    },
  });

  const markAllRead = trpc.user.markAllRead.useMutation({
    onSuccess: () => {
      utils.user.getNotifications.invalidate();
      utils.user.getUnreadCount.invalidate();
    },
  });

  if (!isAuthenticated) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white border-0">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">알림</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => markAllRead.mutate()}
            >
              모두 읽음
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              알림이 없습니다
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
                    !n.isRead && "bg-primary/5"
                  )}
                  onClick={() => !n.isRead && markRead.mutate({ id: n.id })}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                    <div className={cn("flex-1", n.isRead && "pl-4")}>
                      <p className="text-sm font-medium leading-tight">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ko })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
