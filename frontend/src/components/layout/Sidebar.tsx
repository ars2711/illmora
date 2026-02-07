"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  Home,
  Upload,
  BookOpen,
  User,
  MessageCircle,
  ShoppingBag,
  Map,
  Shield,
  Globe,
  Clock,
  Database,
  FileText,
  ShieldCheck,
  Users,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { adminGet } from "@/lib/admin-api";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, demoMode, exitDemo, token } = useAuth();
  const isActive = (path: string) => pathname === path;
  const isAdminSection = pathname?.startsWith("/admin");
  const [adminSearch, setAdminSearch] = useState("");
  const [adminSearchTarget, setAdminSearchTarget] = useState("incidents");
  const [adminSearchCounts, setAdminSearchCounts] = useState<{
    incidents: number;
    audit: number;
    roles: number;
  } | null>(demoMode ? { incidents: 3, audit: 12, roles: 4 } : null);

  const handleAdminSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = adminSearch.trim();
    if (!query) return;
    const targetMap: Record<string, string> = {
      incidents: "/admin/incidents",
      audit: "/admin/audit",
      roles: "/admin/roles",
    };
    const destination = targetMap[adminSearchTarget] ?? "/admin/incidents";
    router.push(`${destination}?q=${encodeURIComponent(query)}`);
  };

  useEffect(() => {
    if (!isAdminSection) return;
    if (demoMode) {
      setAdminSearchCounts({ incidents: 3, audit: 12, roles: 4 });
      return;
    }
    const query = adminSearch.trim();
    if (!query) {
      setAdminSearchCounts(null);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const data = await adminGet<{
          incidents: number;
          audit: number;
          roles: number;
        }>(`/api/v1/admin/search/counts?q=${encodeURIComponent(query)}`, token);
        setAdminSearchCounts(data);
      } catch (error) {
        console.error(error);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [adminSearch, demoMode, isAdminSection, token]);

  // Basic RBAC check for admin link (Simulated for Phase 3 Demo)
  // In production: const isAdmin = useAuth().role === 'INSTITUTION_ADMIN';
  const isAdmin = user?.email?.includes("admin") || true;

  const navItems = demoMode
    ? [
        { name: "Dashboard", href: "/dashboard", icon: Home },
        { name: "My Graph", href: "/graph", icon: BookOpen },
        { name: "AI Tutor", href: "/chat", icon: MessageCircle },
        { name: "History", href: "/dashboard/history", icon: Clock },
      ]
    : [
        { name: "Dashboard", href: "/dashboard", icon: Home },
        { name: "My Graph", href: "/graph", icon: BookOpen },
        { name: "AI Tutor", href: "/chat", icon: MessageCircle },
        { name: "Upload Content", href: "/upload", icon: Upload },
        { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
        { name: "Career Roadmap", href: "/career", icon: Map },
        { name: "History", href: "/dashboard/history", icon: Clock },
        { name: "Profile", href: "/profile", icon: User },
      ];

  if (isAdmin) {
    navItems.push({
      name: "Admin Dashboard",
      href: "/admin/dashboard",
      icon: Shield,
    });
    navItems.push({
      name: "Database Console",
      href: "/admin/database",
      icon: Database,
    });
    navItems.push({
      name: "Audit Logs",
      href: "/admin/audit",
      icon: FileText,
    });
    navItems.push({
      name: "Incident Log",
      href: "/admin/incidents",
      icon: AlertCircle,
    });
    navItems.push({
      name: "Roles & Access",
      href: "/admin/roles",
      icon: Users,
    });
    navItems.push({
      name: "System Health",
      href: "/admin/health",
      icon: ShieldCheck,
    });
    navItems.push({
      name: "Integrations",
      href: "/admin/integrations",
      icon: Globe,
    });
  }

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-slate-200 lg:bg-white/70 lg:pt-5 lg:pb-4 lg:backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center flex-shrink-0 px-6">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">
          Ilmora
        </span>
      </div>
      <div className="mt-6 flex-1 flex flex-col overflow-y-auto">
        {isAdminSection && (
          <form
            onSubmit={handleAdminSearch}
            className="mb-4 px-4 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60"
          >
            <p className="mb-2">Global admin search</p>
            <div className="flex flex-col gap-2">
              <select
                value={adminSearchTarget}
                onChange={(event) => setAdminSearchTarget(event.target.value)}
                aria-label="Admin search target"
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600 outline-none focus:border-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white/70"
              >
                <option value="incidents">Incidents</option>
                <option value="audit">Audit logs</option>
                <option value="roles">Role audit</option>
              </select>
              <input
                value={adminSearch}
                onChange={(event) => setAdminSearch(event.target.value)}
                placeholder="Search"
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600 outline-none focus:border-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white/70"
              />
              <button
                type="submit"
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
              >
                Search
              </button>
              {adminSearchCounts && (
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-white/60">
                  {adminSearchCounts.incidents} incidents •{" "}
                  {adminSearchCounts.audit} audit • {adminSearchCounts.roles}{" "}
                  roles
                </div>
              )}
            </div>
          </form>
        )}
        <nav className="flex-1 px-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive(item.href)
                  ? "bg-slate-900/5 text-slate-900 dark:bg-white/10 dark:text-white"
                  : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              <item.icon
                className={`mr-3 flex-shrink-0 h-6 w-6 ${
                  isActive(item.href)
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-400 group-hover:text-slate-600 dark:text-white/40 dark:group-hover:text-white/70"
                }`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-slate-200 p-4 dark:border-white/10">
        <div className="flex items-center">
          <div className="ml-3">
            <p className="text-sm font-medium text-slate-700 dark:text-white/80">
              {demoMode ? "Demo workspace" : user?.email}
            </p>
            {demoMode && (
              <button
                type="button"
                onClick={exitDemo}
                className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                Exit demo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
