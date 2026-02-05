"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Upload, ShoppingBag, User, MessageCircle } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden safe-area-bottom z-50">
      <div className="flex justify-around items-center h-16">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center p-2 ${isActive("/dashboard") ? "text-indigo-600" : "text-gray-500"}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">Home</span>
        </Link>

        <Link
          href="/marketplace"
          className={`flex flex-col items-center p-2 ${isActive("/marketplace") ? "text-indigo-600" : "text-gray-500"}`}
        >
          <ShoppingBag className="w-6 h-6" />
          <span className="text-xs mt-1">Store</span>
        </Link>

        {/* Upload is central action */}
        <Link href="/upload" className="flex flex-col items-center p-2 -mt-6">
          <div className="bg-indigo-600 rounded-full p-4 shadow-lg text-white">
            <Upload className="w-6 h-6" />
          </div>
        </Link>

        <Link
          href="/chat"
          className={`flex flex-col items-center p-2 ${isActive("/chat") ? "text-indigo-600" : "text-gray-500"}`}
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-xs mt-1">Chat</span>
        </Link>

        <Link
          href="/profile"
          className={`flex flex-col items-center p-2 ${isActive("/profile") ? "text-indigo-600" : "text-gray-500"}`}
        >
          <User className="w-6 h-6" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
