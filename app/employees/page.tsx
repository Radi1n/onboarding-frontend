"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Rocket, Loader2, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AddEmployeeDialog } from "@/components/add-employee-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";

type Employee = {
  id: number;
  job_title: string | null;
  user: { id: number; name: string; email: string };
  department: { id: number; name: string } | null;
  manager: { id: number; name: string } | null;
  onboarding: { id: number; status: string } | null;
};

const STATUS: Record<string, { label: string; className: string }> = {
  employee_pending: { label: "Waiting for employee", className: "bg-slate-100 text-slate-700" },
  hr_review: { label: "HR review", className: "bg-amber-100 text-amber-800" },
  it_setup: { label: "IT setup", className: "bg-sky-100 text-sky-800" },
  manager_approval: { label: "Manager approval", className: "bg-violet-100 text-violet-800" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800" },
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [startingId, setStartingId] = useState<number | null>(null);
  const [role, setRole] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  async function load() {
    try {
      setEmployees(await api<Employee[]>("/employees"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load employees");
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setRole(JSON.parse(stored).role.name);
    load();
  }, []);

  async function startOnboarding(id: number) {
    setStartingId(id);
    setError("");
    try {
      await api(`/employees/${id}/onboarding`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start onboarding");
    } finally {
      setStartingId(null);
    }
  }

  const filtered = useMemo(() => {
    if (!employees) return [];
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.user.name.toLowerCase().includes(q) ||
        e.user.email.toLowerCase().includes(q) ||
        (e.job_title ?? "").toLowerCase().includes(q)
    );
  }, [employees, search]);

  const canManage = role === "hr" || role === "admin";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
            <p className="text-muted-foreground">
              Everyone going through onboarding, in one place.
            </p>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-9"
              />
            </div>
            {canManage && (
              <Button className="h-10" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add employee
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Onboarding</TableHead>
                {canManage && <TableHead className="text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees === null &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={canManage ? 5 : 4}>
                      <div className="h-8 animate-pulse rounded bg-muted" />
                    </TableCell>
                  </TableRow>
                ))}

              {employees !== null && filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 5 : 4}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {search ? "No employees match your search." : "No employees yet."}
                  </TableCell>
                </TableRow>
              )}

              {filtered.map((e) => {
                const status = e.onboarding ? STATUS[e.onboarding.status] : null;
                return (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {e.user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{e.user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {e.job_title ?? e.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{e.department?.name ?? "—"}</TableCell>
                    <TableCell>{e.manager?.name ?? "—"}</TableCell>
                    <TableCell>
                      {status ? (
                        <Badge className={`${status.className} border-0 font-medium`}>
                          {status.label}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not started</span>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        {!e.onboarding && (
                          <Button
                            size="sm"
                            onClick={() => startOnboarding(e.id)}
                            disabled={startingId === e.id}
                          >
                            {startingId === e.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Rocket className="mr-2 h-4 w-4" />
                            )}
                            Start onboarding
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>

      <AddEmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={load}
      />
    </AppShell>
  );
}