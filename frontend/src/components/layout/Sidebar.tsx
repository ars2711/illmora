"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Upload, BookOpen, User, MessageCircle, ShoppingBag, Map, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isActive = (path: string) => pathname === path;
  
  // Basic RBAC check for admin link (Simulated for Phase 3 Demo)
  // In production: const isAdmin = useAuth().role === 'INSTITUTION_ADMIN';
  const isAdmin = user?.email?.includes("admin") || true; 

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Graph", href: "/graph", icon: BookOpen },
    { name: "AI Tutor", href: "/chat", icon: MessageCircle },
    { name: "Upload Content", href: "/upload", icon: Upload },
    { name: "Marketplace", href: "/marketplace", icon: ShoppingBag }, 
    { name: "Career Roadmap", href: "/career", icon: Map }, 
    { name: "Profile", href: "/profile", icon: User },
  ];

  if (isAdmin) {
      navItems.push({ name: "Admin Dashboard", href: "/admin/dashboard", icon: Shield });
      // Added in Phase 3
      navItems.push({ name: "Integrations", href: "/admin/integrations", icon: Globe });
  }

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white lg:pt-5 lg:pb-4">
      <div className="flex items-center flex-shrink-0 px-6">
        <span className="text-2xl font-bold text-indigo-600">Ilmora</span>
      </div>
      <div className="mt-6 flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive(item.href)
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon
                className={`mr-3 flex-shrink-0 h-6 w-6 ${
                  isActive(item.href) ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-500"
                }`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
              <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user?.email}</p>
              </div>
          </div>
      </div>
    </div>
  );
}
