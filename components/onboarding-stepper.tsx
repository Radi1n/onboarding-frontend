import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const STEPS = [
  { key: "employee_pending", label: "Employee details" },
  { key: "hr_review", label: "HR review" },
  { key: "it_setup", label: "IT setup" },
  { key: "manager_approval", label: "Manager approval" },
  { key: "completed", label: "Done" },
];

export const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  employee_pending: { label: "Waiting for employee", className: "bg-slate-100 text-slate-700" },
  hr_review: { label: "HR review", className: "bg-amber-100 text-amber-800" },
  it_setup: { label: "IT setup", className: "bg-sky-100 text-sky-800" },
  manager_approval: { label: "Manager approval", className: "bg-violet-100 text-violet-800" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800" },
};

export function OnboardingStepper({ status }: { status: string }) {
  const current = STEPS.findIndex((s) => s.key === status);

  return (
    <ol className="grid grid-cols-5 gap-2">
      {STEPS.map((step, i) => {
        const done = i < current || status === "completed";
        const active = i === current && status !== "completed";

        return (
          <li key={step.key} className="flex flex-col items-center gap-2 text-center">
            <div className="flex w-full items-center">
              <div
                className={cn(
                  "h-0.5 flex-1",
                  i === 0 ? "bg-transparent" : done || active ? "bg-primary" : "bg-border"
                )}
              />
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
              <div
                className={cn(
                  "h-0.5 flex-1",
                  i === STEPS.length - 1 ? "bg-transparent" : done ? "bg-primary" : "bg-border"
                )}
              />
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}