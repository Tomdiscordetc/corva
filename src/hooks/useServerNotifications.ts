import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export type NotificationCategory = "inquiries" | "assignments" | "appointments" | "summary";
interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}
interface NotificationResult { items: NotificationItem[]; unreadCount: number }

export function useServerNotifications() {
  const email = useAuthStore((s) => s.user?.email ?? "");
  const client = useQueryClient();
  const key = ["server-notifications", email];
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => api<NotificationResult>("/notifications", { signal }),
    enabled: !!email,
    staleTime: 15_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: (action: { type: "read"; id: string } | { type: "all" } | { type: "test"; category: NotificationCategory }) => {
      if (action.type === "read") return api(`/notifications/${encodeURIComponent(action.id)}/read`, { method: "PATCH" });
      if (action.type === "all") return api("/notifications/read-all", { method: "POST" });
      return api("/notifications/test", { method: "POST", body: { category: action.category } });
    },
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
  return {
    ...query,
    busy: mutation.isPending,
    actionError: mutation.error?.message,
    markRead: (id: string) => mutation.mutate({ type: "read", id }),
    markAllRead: () => mutation.mutate({ type: "all" }),
    sendTest: (category: NotificationCategory) => mutation.mutateAsync({ type: "test", category }),
  };
}
