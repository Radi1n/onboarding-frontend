"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

type Option = { id: number; name: string };

const EMPTY = {
  name: "",
  email: "",
  password: "",
  job_title: "",
  department_id: "",
  manager_id: "",
  start_date: "",
};

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function AddEmployeeDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState(EMPTY);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [managers, setManagers] = useState<Option[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setError("");
    api<Option[]>("/departments")
      .then(setDepartments)
      .catch(() => setDepartments([]));
    api<Option[]>("/managers")
      .then(setManagers)
      .catch(() => setManagers([]));
  }, [open]);

  function set(field: keyof typeof EMPTY, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      password: form.password,
    };
    if (form.job_title) payload.job_title = form.job_title;
    if (form.department_id) payload.department_id = Number(form.department_id);
    if (form.manager_id) payload.manager_id = Number(form.manager_id);
    if (form.start_date) payload.start_date = form.start_date;

    try {
      await api("/employees", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onOpenChange(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create employee");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add employee</DialogTitle>
          <DialogDescription>
            Creates the account. You can start their onboarding right after.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Temporary password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job_title">Job title</Label>
              <Input id="job_title" value={form.job_title} onChange={(e) => set("job_title", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Start date</Label>
              <Input id="start_date" type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                value={form.department_id}
                onChange={(e) => set("department_id", e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">No department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager">Manager</Label>
              <select
                id="manager"
                value={form.manager_id}
                onChange={(e) => set("manager_id", e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">No manager</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add employee
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}