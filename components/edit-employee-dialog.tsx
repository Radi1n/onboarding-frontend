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

export type EditableEmployee = {
  id: number;
  job_title: string | null;
  phone: string | null;
  start_date: string | null;
  department_id: number | null;
  manager_id: number | null;
  user: { name: string };
};

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function EditEmployeeDialog({
  employee,
  onOpenChange,
  onSaved,
}: {
  employee: EditableEmployee | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    job_title: "",
    phone: "",
    start_date: "",
    department_id: "",
    manager_id: "",
  });
  const [departments, setDepartments] = useState<Option[]>([]);
  const [managers, setManagers] = useState<Option[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!employee) return;
    setError("");
    setForm({
      job_title: employee.job_title ?? "",
      phone: employee.phone ?? "",
      start_date: employee.start_date ? employee.start_date.slice(0, 10) : "",
      department_id: employee.department_id ? String(employee.department_id) : "",
      manager_id: employee.manager_id ? String(employee.manager_id) : "",
    });
    api<Option[]>("/departments").then(setDepartments).catch(() => setDepartments([]));
    api<Option[]>("/managers").then(setManagers).catch(() => setManagers([]));
  }, [employee]);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employee) return;
    setSaving(true);
    setError("");

    try {
      await api(`/employees/${employee.id}`, {
        method: "PUT",
        body: JSON.stringify({
          job_title: form.job_title.trim() || null,
          phone: form.phone.trim() || null,
          start_date: form.start_date || null,
          department_id: form.department_id ? Number(form.department_id) : null,
          manager_id: form.manager_id ? Number(form.manager_id) : null,
        }),
      });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!employee} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {employee?.user.name}</DialogTitle>
          <DialogDescription>
            Update the department, manager and job details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="e-title">Job title</Label>
              <Input id="e-title" value={form.job_title} onChange={(e) => set("job_title", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-phone">Phone</Label>
              <Input id="e-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="e-start">Start date</Label>
            <Input id="e-start" type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="e-dept">Department</Label>
              <select
                id="e-dept"
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
              <Label htmlFor="e-manager">Manager</Label>
              <select
                id="e-manager"
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
              Save changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}