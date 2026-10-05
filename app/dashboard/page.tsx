"use client";

import { useEffect, useState } from "react";
import { Users, Clock, CheckCircle2, FileCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

type Stats = {
  active: number;
  pending_review: number;
  completed: number;
  documents_to_review: number;
};

const CARDS = [
  { key: "active", label: "Active onboardings", icon: Users, tone: "bg-emerald-100 text-emerald-700" },
  { key: "pending_review", label: "Pending review", icon: Clock, tone: "bg-amber-100 text-amber-700" },
  { key: "completed", label: "Completed", icon: CheckCircle2, tone: "bg-teal-100 text-teal-700" },
  { key: "documents_to_review", label: "Documents to review", icon: FileCheck, tone: "bg-sky-100 text-sky-700" },
] as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Stats>("/dashboard/stats")
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your onboarding activity.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CARDS.map((c) => (
            <Card key={c.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {c.label}
                </CardTitle>
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${c.tone}`}>
                  <c.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <p className="text-3xl font-bold">{stats[c.key]}</p>
                ) : (
                  <div className="h-9 w-16 animate-pulse rounded bg-muted" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}