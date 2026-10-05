"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Eye,
  FileText,
  Loader2,
  Undo2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OnboardingStepper, STATUS_BADGE } from "@/components/onboarding-stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, openFile } from "@/lib/api";
import { cn } from "@/lib/utils";

type Task = { id: number; title: string; assigned_role: string; status: string };
type Doc = {
  id: number;
  type: string;
  original_name: string;
  status: "pending" | "approved" | "rejected";
  reject_reason: string | null;
};
type Detail = {
  id: number;
  status: string;
  completed_at: string | null;
  tasks: Task[];
  documents: Doc[];
  employee: {
    job_title: string | null;
    start_date: string | null;
    user: { name: string; email: string };
    department: { name: string } | null;
    manager: { name: string } | null;
  };
};

const DOC_TYPES = ["national_id", "contract"];

const DOC_LABEL: Record<string, string> = {
  national_id: "National ID",
  contract: "Signed contract",
};

const DOC_BADGE = {
  pending: { text: "Pending review", className: "bg-amber-100 text-amber-800" },
  approved: { text: "Approved", className: "bg-emerald-100 text-emerald-800" },
  rejected: { text: "Rejected", className: "bg-red-100 text-red-800" },
} as const;

const ROLE_LABEL: Record<string, string> = {
  employee: "Employee",
  hr: "HR",
  it: "IT",
  manager: "Manager",
};

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function OnboardingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [role, setRole] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await api<Detail>(`/onboardings/${id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load onboarding");
    } finally {
      setLoaded(true);
    }
  }, [id]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setRole(JSON.parse(stored).role.name);
    load();
  }, [load]);

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  const reviewDoc = (docId: number, decision: "approve" | "reject", why?: string) =>
    run(`doc-${docId}`, async () => {
      await api(`/documents/${docId}/review`, {
        method: "PATCH",
        body: JSON.stringify({ decision, reason: why }),
      });
      setRejectingId(null);
      setReason("");
    });

  const decide = (decision: "approve" | "reject") =>
    run(decision, () =>
      api(`/onboardings/${id}/hr-decision`, {
        method: "POST",
        body: JSON.stringify({
          decision,
          comment: decision === "reject" ? "Some documents need to be updated." : undefined,
        }),
      })
    );

  const completeTask = (taskId: number) =>
    run(`task-${taskId}`, () => api(`/tasks/${taskId}/complete`, { method: "POST" }));

  const managerDecide = (decision: "approve" | "reject") =>
    run(`m-${decision}`, async () => {
      await api(`/onboardings/${id}/manager-decision`, {
        method: "POST",
        body: JSON.stringify({
          decision,
          comment: decision === "reject" ? note.trim() : undefined,
        }),
      });
      setNote("");
    });

  async function view(docId: number) {
    setError("");
    try {
      await openFile(`/documents/${docId}/download`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open the file");
    }
  }

  const isHr = role === "hr" || role === "admin";
  const isIt = role === "it" || role === "admin";
  const isManager = role === "manager" || role === "admin";

  const canReview = isHr && data?.status === "hr_review";
  const canSetup = isIt && data?.status === "it_setup";
  const canApprove = isManager && data?.status === "manager_approval";

  const docs = data?.documents ?? [];
  const allApproved = DOC_TYPES.every(
    (t) => docs.find((d) => d.type === t)?.status === "approved"
  );
  const anyRejected = docs.some((d) => d.status === "rejected");

  const itTasks = (data?.tasks ?? []).filter((t) => t.assigned_role === "it");
  const itDone = itTasks.filter((t) => t.status === "done").length;

  const badge = data ? STATUS_BADGE[data.status] : null;
  const backHref = role === "it" || role === "manager" ? "/tasks" : "/employees";
  const backLabel = role === "it" || role === "manager" ? "Back to my tasks" : "Back to employees";

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loaded && <div className="h-64 animate-pulse rounded-xl bg-muted" />}

        {data && (
          <>
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                  {data.employee.user.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{data.employee.user.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {data.employee.job_title ?? data.employee.user.email}
                  </p>
                </div>
              </div>
              {badge && (
                <Badge className={cn("w-fit border-0 px-3 py-1 text-sm font-medium", badge.className)}>
                  {badge.label}
                </Badge>
              )}
            </div>

            <Card>
              <CardContent className="pt-6">
                <OnboardingStepper status={data.status} />
              </CardContent>
            </Card>

            {data.status === "completed" && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-800">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">
                  Onboarding completed on {formatDate(data.completed_at)}.
                </p>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left column */}
              <div className="space-y-6 lg:col-span-2">
                {/* IT setup */}
                {canSetup && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">IT setup</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {itDone} of {itTasks.length} done
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{
                              width: `${itTasks.length ? (itDone / itTasks.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Complete each task from the checklist. When all of them are done, this
                        request moves to the manager automatically.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Manager approval */}
                {canApprove && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Final approval</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        HR approved the documents and IT finished the setup. Approve to complete
                        this onboarding, or send it back to IT with a note.
                      </p>
                      <Input
                        placeholder="Note for IT (required when sending back)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                      <div className="flex flex-wrap gap-3">
                        <Button disabled={busy === "m-approve"} onClick={() => managerDecide("approve")}>
                          {busy === "m-approve" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Approve and complete
                        </Button>
                        <Button
                          variant="outline"
                          disabled={!note.trim() || busy === "m-reject"}
                          onClick={() => managerDecide("reject")}
                        >
                          {busy === "m-reject" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Undo2 className="mr-2 h-4 w-4" />
                          )}
                          Send back to IT
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Documents (hidden from IT) */}
                {role !== "it" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {DOC_TYPES.map((type) => {
                        const doc = docs.find((d) => d.type === type);
                        const docBadge = doc ? DOC_BADGE[doc.status] : null;
                        const isRejecting = !!doc && rejectingId === doc.id;

                        return (
                          <div key={type} className="rounded-xl border bg-card p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-medium">{DOC_LABEL[type]}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {doc ? doc.original_name : "Not uploaded yet"}
                                  </p>
                                </div>
                              </div>
                              {docBadge && (
                                <Badge className={cn("border-0 font-medium", docBadge.className)}>
                                  {docBadge.text}
                                </Badge>
                              )}
                            </div>

                            {doc?.status === "rejected" && doc.reject_reason && (
                              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                                Reason: {doc.reject_reason}
                              </p>
                            )}

                            {doc && (
                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => view(doc.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Button>

                                {canReview && doc.status !== "approved" && (
                                  <Button
                                    size="sm"
                                    disabled={busy === `doc-${doc.id}`}
                                    onClick={() => reviewDoc(doc.id, "approve")}
                                  >
                                    {busy === `doc-${doc.id}` ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="mr-2 h-4 w-4" />
                                    )}
                                    Approve
                                  </Button>
                                )}

                                {canReview && doc.status !== "rejected" && !isRejecting && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-700 hover:text-red-800"
                                    onClick={() => {
                                      setRejectingId(doc.id);
                                      setReason("");
                                    }}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Reject
                                  </Button>
                                )}
                              </div>
                            )}

                            {isRejecting && doc && (
                              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                <Input
                                  autoFocus
                                  placeholder="Why is this rejected?"
                                  value={reason}
                                  onChange={(e) => setReason(e.target.value)}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={!reason.trim() || busy === `doc-${doc.id}`}
                                    onClick={() => reviewDoc(doc.id, "reject", reason.trim())}
                                  >
                                    Confirm
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setRejectingId(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}

                {/* HR decision */}
                {canReview && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Your decision</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {allApproved
                          ? "Both documents are approved. You can send this to IT."
                          : anyRejected
                          ? "A document was rejected. Send it back so the employee can upload it again."
                          : "Review both documents to continue."}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          disabled={!allApproved || busy === "approve"}
                          onClick={() => decide("approve")}
                        >
                          {busy === "approve" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Approve and send to IT
                        </Button>
                        <Button
                          variant="outline"
                          disabled={!anyRejected || busy === "reject"}
                          onClick={() => decide("reject")}
                        >
                          {busy === "reject" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Undo2 className="mr-2 h-4 w-4" />
                          )}
                          Return to employee
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right column */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Employee details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-3 text-sm">
                      {[
                        ["Email", data.employee.user.email],
                        ["Department", data.employee.department?.name ?? "—"],
                        ["Manager", data.employee.manager?.name ?? "—"],
                        ["Start date", formatDate(data.employee.start_date)],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">{label}</dt>
                          <dd className="truncate text-right font-medium">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Checklist</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {data.tasks.map((t) => {
                      const actionable = canSetup && t.assigned_role === "it" && t.status !== "done";
                      return (
                        <div key={t.id} className="flex items-center justify-between gap-3 py-2">
                          <div className="flex items-center gap-3">
                            {t.status === "done" ? (
                              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                            ) : (
                              <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                            )}
                            <span
                              className={cn(
                                "text-sm",
                                t.status === "done" && "text-muted-foreground line-through"
                              )}
                            >
                              {t.title}
                            </span>
                          </div>
                          {actionable ? (
                            <Button
                              size="sm"
                              className="shrink-0"
                              disabled={busy === `task-${t.id}`}
                              onClick={() => completeTask(t.id)}
                            >
                              {busy === `task-${t.id}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Mark done"
                              )}
                            </Button>
                          ) : (
                            <Badge variant="secondary" className="shrink-0 font-normal">
                              {ROLE_LABEL[t.assigned_role] ?? t.assigned_role}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}