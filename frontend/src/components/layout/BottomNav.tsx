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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

export function BottomNav() {
  const pathname = usePathname();
  const { demoMode } = useAuth();
  const t = useTranslations("bottomNav");

  const isActive = (path: string) => pathname === path;

  const navItems = demoMode
    ? [
        { href: "/dashboard", label: t("home"), icon: Home },
        { href: "/graph", label: t("graph"), icon: BookOpen },
        { href: "/chat", label: t("chat"), icon: MessageCircle },
        { href: "/dashboard/history", label: t("history"), icon: Clock },
      ]
    : [
        { href: "/dashboard", label: t("home"), icon: Home },
        { href: "/marketplace", label: t("store"), icon: ShoppingBag },
        { href: "/chat", label: t("chat"), icon: MessageCircle },
        { href: "/profile", label: t("profile"), icon: User },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden safe-area-bottom z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.slice(0, 2).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center p-2 ${isActive(item.href) ? "text-indigo-600" : "text-gray-500"}`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}

        {!demoMode && (
          <Link href="/upload" className="flex flex-col items-center p-2 -mt-6">
            <div className="bg-indigo-600 rounded-full p-4 shadow-lg text-white">
              <Upload className="w-6 h-6" />
            </div>
          </Link>
        )}

        {navItems.slice(2).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center p-2 ${isActive(item.href) ? "text-indigo-600" : "text-gray-500"}`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
