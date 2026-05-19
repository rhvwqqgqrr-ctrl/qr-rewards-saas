"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { href: "/platform/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/platform/restaurants", label: "Restaurants", icon: "🏪" },
  { href: "/platform/audit", label: "Audit", icon: "📋" },
];

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/platform/login") return;
    const token = localStorage.getItem("platform_token");
    if (!token) router.push("/platform/login");
  }, [pathname, router]);

  if (pathname === "/platform/login") return <>{children}</>;

  function handleLogout() {
    localStorage.removeItem("platform_token");
    localStorage.removeItem("platform_user");
    router.push("/platform/login");
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <h1 className="font-display text-lg font-bold text-white">QR Rewards Platform</h1>
        <button onClick={handleLogout} className="text-sm text-red-400 font-medium">Déconnexion</button>
      </header>
      <div className="flex">
        <nav className="hidden md:block w-56 bg-gray-800 border-r border-gray-700 min-h-[calc(100vh-57px)] p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith(item.href)
                      ? "bg-gray-700 text-white"
                      : "text-gray-400 hover:bg-gray-700/50 hover:text-gray-200"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="flex-1 p-6 text-gray-100">{children}</main>
      </div>
    </div>
  );
}
