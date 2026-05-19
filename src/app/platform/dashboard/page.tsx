"use client";

import { useEffect, useState } from "react";
import { platformFetch } from "@/lib/platform-fetch";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface PlatformDashboard {
  metrics: {
    totalRestaurants: number;
    activeRestaurants: number;
    totalCampaigns: number;
    activeCampaigns: number;
    totalSpins: number;
    totalCoupons: number;
    totalRedemptions: number;
  };
  restaurants: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    _count: { campaigns: number; coupons: number };
  }>;
}

export default function PlatformDashboardPage() {
  const [data, setData] = useState<PlatformDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    platformFetch("/api/platform/analytics")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!data) return null;

  const m = data.metrics;
  const stats = [
    { label: "Restaurants", value: m.totalRestaurants, sub: `${m.activeRestaurants} actifs` },
    { label: "Campagnes", value: m.totalCampaigns, sub: `${m.activeCampaigns} actives` },
    { label: "Spins (30j)", value: m.totalSpins },
    { label: "Coupons (30j)", value: m.totalCoupons },
    { label: "Redemptions (30j)", value: m.totalRedemptions },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard Plateforme</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-400">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
            {s.sub && <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      <h3 className="text-lg font-semibold text-white mb-4">Restaurants</h3>
      <div className="space-y-2">
        {data.restaurants.map((r) => (
          <div key={r.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center justify-between">
            <div>
              <p className="font-medium text-white">{r.name}</p>
              <p className="text-sm text-gray-400">/{r.slug} · {r._count.campaigns} campagnes · {r._count.coupons} coupons</p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${r.status === "ACTIVE" ? "bg-emerald-900/50 text-emerald-400" : "bg-red-900/50 text-red-400"}`}>
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
