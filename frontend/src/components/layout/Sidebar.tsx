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
import { useTranslations } from "next-intl";

export function Sidebar() {
  const t = useTranslations("sidebar");
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
        { name: t("nav.dashboard"), href: "/dashboard", icon: Home },
        { name: t("nav.graph"), href: "/graph", icon: BookOpen },
        { name: t("nav.tutor"), href: "/chat", icon: MessageCircle },
        { name: t("nav.history"), href: "/dashboard/history", icon: Clock },
      ]
    : [
        { name: t("nav.dashboard"), href: "/dashboard", icon: Home },
        { name: t("nav.graph"), href: "/graph", icon: BookOpen },
        { name: t("nav.tutor"), href: "/chat", icon: MessageCircle },
        { name: t("nav.upload"), href: "/upload", icon: Upload },
        { name: t("nav.marketplace"), href: "/marketplace", icon: ShoppingBag },
        { name: t("nav.career"), href: "/career", icon: Map },
        { name: t("nav.history"), href: "/dashboard/history", icon: Clock },
        { name: t("nav.profile"), href: "/profile", icon: User },
      ];

  if (isAdmin) {
    navItems.push({
      name: t("nav.adminDashboard"),
      href: "/admin/dashboard",
      icon: Shield,
    });
    navItems.push({
      name: t("nav.database"),
      href: "/admin/database",
      icon: Database,
    });
    navItems.push({
      name: t("nav.audit"),
      href: "/admin/audit",
      icon: FileText,
    });
    navItems.push({
      name: t("nav.incidents"),
      href: "/admin/incidents",
      icon: AlertCircle,
    });
    navItems.push({
      name: t("nav.roles"),
      href: "/admin/roles",
      icon: Users,
    });
    navItems.push({
      name: t("nav.health"),
      href: "/admin/health",
      icon: ShieldCheck,
    });
    navItems.push({
      name: t("nav.integrations"),
      href: "/admin/integrations",
      icon: Globe,
    });
  }

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-slate-200 lg:bg-white/70 lg:pt-5 lg:pb-4 lg:backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center flex-shrink-0 px-6">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("brand")}
        </span>
      </div>
      <div className="mt-6 flex-1 flex flex-col overflow-y-auto">
        {isAdminSection && (
          <form
            onSubmit={handleAdminSearch}
            className="mb-4 px-4 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60"
          >
            <p className="mb-2">{t("adminSearch.title")}</p>
            <div className="flex flex-col gap-2">
              <select
                value={adminSearchTarget}
                onChange={(event) => setAdminSearchTarget(event.target.value)}
                aria-label={t("adminSearch.targetLabel")}
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600 outline-none focus:border-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white/70"
              >
                <option value="incidents">
                  {t("adminSearch.targets.incidents")}
                </option>
                <option value="audit">{t("adminSearch.targets.audit")}</option>
                <option value="roles">{t("adminSearch.targets.roles")}</option>
              </select>
              <input
                value={adminSearch}
                onChange={(event) => setAdminSearch(event.target.value)}
                placeholder={t("adminSearch.placeholder")}
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600 outline-none focus:border-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white/70"
              />
              <button
                type="submit"
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
              >
                {t("adminSearch.submit")}
              </button>
              {adminSearchCounts && (
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-white/60">
                  {t("adminSearch.counts", {
                    incidents: adminSearchCounts.incidents,
                    audit: adminSearchCounts.audit,
                    roles: adminSearchCounts.roles,
                  })}
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
              {demoMode ? t("demoWorkspace") : user?.email}
            </p>
            {demoMode && (
              <button
                type="button"
                onClick={exitDemo}
                className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                {t("exitDemo")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
