"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  Upload,
  Send,
  XCircle,
  Clock,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Task = { id: number; title: string; assigned_role: string; status: string };
type Onboarding = { id: number; status: string; tasks: Task[] };
type Doc = {
  id: number;
  type: string;
  original_name: string;
  status: "pending" | "approved" | "rejected";
  reject_reason: string | null;
};
type EmployeeRow = { id: number; onboarding: { id: number; status: string } | null };

const STEPS = [
  { key: "employee_pending", label: "Your details" },
  { key: "hr_review", label: "HR review" },
  { key: "it_setup", label: "IT setup" },
  { key: "manager_approval", label: "Manager approval" },
  { key: "completed", label: "Done" },
];

const DOC_TYPES = [
  { type: "national_id", label: "National ID", hint: "A clear photo or PDF of your ID" },
  { type: "contract", label: "Signed contract", hint: "The signed employment contract" },
];

const ROLE_LABEL: Record<string, string> = {
  employee: "You",
  hr: "HR",
  it: "IT",
  manager: "Manager",
};

function Stepper({ status }: { status: string }) {
  const current = STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="grid grid-cols-5 gap-2">
      {STEPS.map((step, i) => {
        const done = i < current || status === "completed";
        const active = i === current && status !== "completed";
        return (
          <li key={step.key} className="flex flex-col items-center gap-2 text-center">
            <div className="flex w-full items-center">
              <div className={cn("h-0.5 flex-1", i === 0 ? "bg-transparent" : done || active ? "bg-primary" : "bg-border")} />
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-primary/10 text-primary",
                  !done && !active && "border-border bg-card text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <div className={cn("h-0.5 flex-1", i === STEPS.length - 1 ? "bg-transparent" : done ? "bg-primary" : "bg-border")} />
            </div>
            <span className={cn("text-xs font-medium", active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground")}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function DocumentCard({
  type,
  label,
  hint,
  doc,
  editable,
  busy,
  onUpload,
}: {
  type: string;
  label: string;
  hint: string;
  doc?: Doc;
  editable: boolean;
  busy: boolean;
  onUpload: (type: string, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const badge = doc
    ? {
        pending: { text: "Pending review", className: "bg-amber-100 text-amber-800" },
        approved: { text: "Approved", className: "bg-emerald-100 text-emerald-800" },
        rejected: { text: "Rejected", className: "bg-red-100 text-red-800" },
      }[doc.status]
    : null;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{doc ? doc.original_name : hint}</p>
          </div>
        </div>
        {badge && <Badge className={cn("border-0 font-medium", badge.className)}>{badge.text}</Badge>}
      </div>

      {doc?.status === "rejected" && doc.reject_reason && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Reason: {doc.reject_reason}
        </p>
      )}

      {editable && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(type, file);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {doc ? "Replace file" : "Upload file"}
          </Button>
        </>
      )}
    </div>
  );
}

export default function MyOnboardingPage() {
  const [onboarding, setOnboarding] = useState<Onboarding | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const employees = await api<EmployeeRow[]>("/employees");
      const ob = employees[0]?.onboarding;
      if (!ob) {
        setOnboarding(null);
        setDocs([]);
        return;
      }
      const [o, d] = await Promise.all([
        api<Onboarding>(`/onboardings/${ob.id}`),
        api<Doc[]>(`/onboardings/${ob.id}/documents`),
      ]);
      setOnboarding(o);
      setDocs(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load your onboarding");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(type: string, file: File) {
    if (!onboarding) return;
    setUploading(type);
    setError("");
    const body = new FormData();
    body.append("type", type);
    body.append("file", file);
    try {
      await api(`/onboardings/${onboarding.id}/documents`, { method: "POST", body });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function submit() {
    if (!onboarding) return;
    setSubmitting(true);
    setError("");
    try {
      await api(`/onboardings/${onboarding.id}/submit`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  const editable = onboarding?.status === "employee_pending";
  const hasBoth = DOC_TYPES.every((d) => docs.some((x) => x.type === d.type));
  const anyRejected = docs.some((d) => d.status === "rejected");
  const canSubmit = editable && hasBoth && !anyRejected;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">My onboarding</h1>
          <p className="text-muted-foreground">Follow your progress and complete what is needed from you.</p>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loaded && <div className="h-48 animate-pulse rounded-xl bg-muted" />}

        {loaded && !onboarding && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Clock className="h-6 w-6" />
              </div>
              <p className="font-medium">Your onboarding has not started yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                HR will start it soon. Once it does, you will see your steps here.
              </p>
            </CardContent>
          </Card>
        )}

        {onboarding && (
          <>
            <Card>
              <CardContent className="pt-6">
                <Stepper status={onboarding.status} />
              </CardContent>
            </Card>

            {onboarding.status === "completed" && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-800">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">All done. Welcome aboard!</p>
              </div>
            )}

            {onboarding.status !== "employee_pending" && onboarding.status !== "completed" && (
              <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-4">
                <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  You have submitted everything. The team is working on the next steps.
                </p>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {DOC_TYPES.map((d) => (
                  <DocumentCard
                    key={d.type}
                    {...d}
                    doc={docs.find((x) => x.type === d.type)}
                    editable={!!editable}
                    busy={uploading === d.type}
                    onUpload={upload}
                  />
                ))}

                {editable && (
                  <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      {canSubmit
                        ? "Everything is ready. Send it to HR."
                        : anyRejected
                        ? "A document was rejected. Please upload it again."
                        : "Upload both documents to continue."}
                    </p>
                    <Button onClick={submit} disabled={!canSubmit || submitting}>
                      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Submit to HR
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {onboarding.tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5">
                    <div className="flex items-center gap-3">
                      {t.status === "done" ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                      )}
                      <span className={cn("text-sm", t.status === "done" && "text-muted-foreground line-through")}>
                        {t.title}
                      </span>
                    </div>
                    <Badge variant="secondary" className="shrink-0 font-normal">
                      {ROLE_LABEL[t.assigned_role] ?? t.assigned_role}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}