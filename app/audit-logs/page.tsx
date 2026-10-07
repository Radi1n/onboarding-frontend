"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Log = {
  id: number;
  action: string;
  description: string | null;
  created_at: string;
  user: { id: number; name: string } | null;
};

type Page = {
  data: Log[];
  current_page: number;
  last_page: number;
  total: number;
};

const GROUP_STYLE: Record<string, string> = {
  employee: "bg-sky-100 text-sky-800",
  onboarding: "bg-emerald-100 text-emerald-800",
  document: "bg-amber-100 text-amber-800",
  task: "bg-violet-100 text-violet-800",
};

function actionStyle(action: string) {
  return GROUP_STYLE[action.split(".")[0]] ?? "bg-slate-100 text-slate-700";
}

function formatWhen(date: string) {
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    api<Page>(`/audit-logs?page=${page}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [page]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
          <p className="text-muted-foreground">
            A record of who did what, and when.
            {data ? ` ${data.total} events in total.` : ""}
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-40">When</TableHead>
                <TableHead className="w-40">Who</TableHead>
                <TableHead className="w-52">Event</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data === null &&
                !error &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <div className="h-7 animate-pulse rounded bg-muted" />
                    </TableCell>
                  </TableRow>
                ))}

              {data && data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                      <ScrollText className="h-6 w-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No activity recorded yet.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {data?.data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatWhen(log.created_at)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {log.user?.name ?? "System"}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border-0 font-medium capitalize", actionStyle(log.action))}>
                      {log.action.replace(/[._]/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {data.current_page} of {data.last_page}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}