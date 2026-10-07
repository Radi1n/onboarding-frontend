"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardList,
  LogOut,
  UserCheck,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type User = { id: number; name: string; email: string; role: { name: string } };

type NavItem = { label: string; href: string; icon: LucideIcon; roles: string[] };

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "hr", "manager", "it", "employee"] },
  { label: "Employees", href: "/employees", icon: Users, roles: ["admin", "hr", "manager"] },
  { label: "Departments", href: "/departments", icon: Building2, roles: ["admin", "hr"] },
  { label: "My Onboarding", href: "/my-onboarding", icon: UserCheck, roles: ["employee"] },
  { label: "My Tasks", href: "/tasks", icon: ClipboardList, roles: ["it", "manager"] },
  { label: "Audit log", href: "/audit-logs", icon: ScrollText, roles: ["admin"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  function logout() {
    localStorage.clear();
    router.replace("/login");
  }

  if (!user) return null;

  const items = NAV.filter((item) => item.roles.includes(user.role.name));
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Users className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Onboard</span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <h2 className="text-sm font-medium text-muted-foreground md:hidden">Onboard</h2>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Badge variant="secondary" className="uppercase">
              {user.role.name}
            </Badge>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}