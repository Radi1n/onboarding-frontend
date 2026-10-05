"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { STATUS_BADGE } from "@/components/onboarding-stepper";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Employee = {
  id: number;
  job_title: string | null;
  user: { name: string; email: string };
  department: { name: string } | null;
  onboarding: { id: number; status: string } | null;
};

export default function TasksPage() {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setRole(JSON.parse(stored).role.name);

    api<Employee[]>("/employees")
      .then(setEmployees)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const waitingFor =
    role === "it"
      ? ["it_setup"]
      : role === "manager"
      ? ["manager_approval"]
      : ["it_setup", "manager_approval"];

  const waiting = (employees ?? []).filter(
    (e) => e.onboarding && waitingFor.includes(e.onboarding.status)
  );

  const subtitle =
    role === "it"
      ? "New hires waiting for their accounts and equipment."
      : "New hires waiting for your final approval.";

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">My tasks</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {employees === null && !error && (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {employees !== null && waiting.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="font-medium">You are all caught up</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Nothing is waiting for you right now. New requests will show up here.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {waiting.map((e) => {
            const badge = STATUS_BADGE[e.onboarding!.status];
            return (
              <Card key={e.id}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {e.user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{e.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {e.job_title ?? e.user.email}
                        {e.department ? ` · ${e.department.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {badge && (
                      <Badge className={cn("hidden border-0 font-medium sm:inline-flex", badge.className)}>
                        {badge.label}
                      </Badge>
                    )}
                    <Link
                      href={`/onboardings/${e.onboarding!.id}`}
                      className={buttonVariants({ size: "sm" })}
                    >
                      Open
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}