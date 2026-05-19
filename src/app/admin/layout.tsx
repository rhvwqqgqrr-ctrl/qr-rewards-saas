"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/campaigns", label: "Campagnes", icon: "🎯" },
  { href: "/admin/coupons", label: "Coupons", icon: "🎟️" },
  { href: "/admin/staff", label: "Staff", icon: "👥" },
  { href: "/admin/settings", label: "Paramètres", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [restaurant, setRestaurant] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (pathname === "/admin/login") return;
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    const r = localStorage.getItem("admin_restaurant");
    if (r) setRestaurant(JSON.parse(r));
  }, [pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;

  function handleLogout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_restaurant");
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-lg font-bold text-brand-800">
            {restaurant?.name || "Admin"}
          </h1>
        </div>
        <button onClick={handleLogout} className="text-sm text-red-600 font-medium">
          Déconnexion
        </button>
      </header>

      <div className="flex">
        <nav className="hidden md:block w-56 bg-white border-r border-gray-200 min-h-[calc(100vh-57px)] p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith(item.href)
                      ? "bg-brand-50 text-brand-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <ul className="flex justify-around py-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs ${
                    pathname.startsWith(item.href) ? "text-brand-600" : "text-gray-500"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 p-6 pb-24 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
