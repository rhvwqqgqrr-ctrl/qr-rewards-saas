"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Coupon {
  id: string;
  humanCode: string;
  status: string;
  createdAt: string;
  activationAt: string;
  expiresAt: string;
  redeemedAt: string | null;
  prize: { type: string; label: string };
  campaign: { name: string };
  redeemedBy: { name: string; email: string } | null;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadCoupons();
  }, [page, statusFilter]);

  async function loadCoupons() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (statusFilter) params.set("status", statusFilter);
      const data = await adminFetch(`/api/admin/coupons?${params}`);
      setCoupons(data.coupons);
      setTotalPages(data.pagination.totalPages);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }

  async function exportCsv() {
    const token = localStorage.getItem("admin_token");
    const res = await fetch("/api/admin/coupons/export", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coupons-${Date.now()}.csv`;
    a.click();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Coupons</h2>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field w-auto text-sm"
          >
            <option value="">Tous les statuts</option>
            <option value="ISSUED">Émis</option>
            <option value="ACTIVE">Actif</option>
            <option value="REDEEMED">Utilisé</option>
            <option value="EXPIRED">Expiré</option>
          </select>
          <button onClick={exportCsv} className="btn-secondary text-sm">Export CSV</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : coupons.length === 0 ? (
        <div className="card text-center py-12"><p className="text-gray-500">Aucun coupon</p></div>
      ) : (
        <>
          <div className="space-y-2">
            {coupons.map((c) => (
              <div key={c.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-mono font-semibold">{c.humanCode}</p>
                  <p className="text-sm text-gray-600">{c.prize.label}</p>
                  <p className="text-xs text-gray-400">
                    {c.campaign.name} · {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={c.status} />
                  {c.redeemedBy && (
                    <p className="text-xs text-gray-400 mt-1">par {c.redeemedBy.name || c.redeemedBy.email}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary text-sm">Précédent</button>
              <span className="px-4 py-2 text-sm text-gray-600">{page} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-secondary text-sm">Suivant</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
