"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Upload,
  ShoppingBag,
  User,
  MessageCircle,
  BookOpen,
  Clock,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

export function BottomNav() {
  const pathname = usePathname();
  const { demoMode, user } = useAuth();
  const t = useTranslations("bottomNav");

  const isActive = (path: string) => pathname === path;

  const isEducator = user?.role === "educator";

  const navItems = demoMode
    ? [
        { href: "/dashboard", label: t("home"), icon: Home },
        { href: "/graph", label: t("graph"), icon: BookOpen },
        { href: "/chat", label: t("chat"), icon: MessageCircle },
        { href: "/dashboard/history", label: t("history"), icon: Clock },
      ]
    : [
        { href: "/dashboard", label: t("home"), icon: Home },
        isEducator
          ? { href: "/teacher", label: "Teacher", icon: BookOpen }
          : { href: "/marketplace", label: t("store"), icon: ShoppingBag },
        { href: "/chat", label: t("chat"), icon: MessageCircle },
        { href: "/settings/profile", label: t("profile"), icon: Settings },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-white/10 lg:hidden safe-area-bottom z-50 backdrop-blur-md">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 p-1 transition-colors ${
                active
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Icon size={active ? 22 : 20} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
