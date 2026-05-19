"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface DashboardData {
  period: { days: number };
  metrics: {
    totalScans: number;
    totalSessions: number;
    totalSpins: number;
    totalWins: number;
    totalLosses: number;
    winRate: string;
    totalCouponsIssued: number;
    totalCouponsRedeemed: number;
    redemptionRate: string;
    reviewClicks: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    loadDashboard();
  }, [period]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const result = await adminFetch(`/api/admin/analytics?days=${period}`);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const m = data?.metrics;

  const stats = [
    { label: "Scans QR", value: m?.totalScans || 0, color: "bg-blue-50 text-blue-700" },
    { label: "Sessions", value: m?.totalSessions || 0, color: "bg-indigo-50 text-indigo-700" },
    { label: "Spins", value: m?.totalSpins || 0, color: "bg-purple-50 text-purple-700" },
    { label: "Gains", value: m?.totalWins || 0, color: "bg-emerald-50 text-emerald-700" },
    { label: "Taux de gain", value: m?.winRate || "0%", color: "bg-green-50 text-green-700" },
    { label: "Coupons émis", value: m?.totalCouponsIssued || 0, color: "bg-yellow-50 text-yellow-700" },
    { label: "Coupons utilisés", value: m?.totalCouponsRedeemed || 0, color: "bg-orange-50 text-orange-700" },
    { label: "Taux utilisation", value: m?.redemptionRate || "0%", color: "bg-red-50 text-red-700" },
    { label: "Clics avis Google", value: m?.reviewClicks || 0, color: "bg-teal-50 text-teal-700" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(parseInt(e.target.value))}
          className="input-field w-auto"
        >
          <option value={7}>7 jours</option>
          <option value={30}>30 jours</option>
          <option value={90}>90 jours</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
            <p className="text-sm font-medium opacity-75">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
