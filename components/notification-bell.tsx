"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  title: string;
  body: string;
  onboarding_id: number | null;
  read: boolean;
  created_at: string;
};

type Payload = { unread_count: number; items: Item[] };

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Payload>({ unread_count: 0, items: [] });
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setData(await api<Payload>("/notifications"));
    } catch {
      /* ignore */
    } finally {
      setLoaded(true);
    }
  }, []);

  // نحدّث كل 30 ثانية
  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  // نقفل القائمة لما تضغطين برا
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function openItem(item: Item) {
    setOpen(false);

    if (!item.read) {
      await api(`/notifications/${item.id}/read`, { method: "POST" }).catch(() => {});
      load();
    }

    const stored = localStorage.getItem("user");
    const role = stored ? JSON.parse(stored).role.name : "";

    if (item.onboarding_id) {
      router.push(role === "employee" ? "/my-onboarding" : `/onboardings/${item.onboarding_id}`);
    }
  }

  async function markAll() {
    await api("/notifications/read-all", { method: "POST" }).catch(() => {});
    load();
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        className="relative"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="h-4 w-4" />
        {data.unread_count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {data.unread_count > 9 ? "9+" : data.unread_count}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {data.unread_count > 0 && (
              <button
                onClick={markAll}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!loaded && <div className="m-4 h-12 animate-pulse rounded bg-muted" />}

            {loaded && data.items.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Bell className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Nothing new yet</p>
              </div>
            )}

            {data.items.map((item) => (
              <button
                key={item.id}
                onClick={() => openItem(item)}
                className={cn(
                  "flex w-full items-start gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted/60",
                  !item.read && "bg-primary/5"
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    item.read ? "bg-transparent" : "bg-primary"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {timeAgo(item.created_at)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}