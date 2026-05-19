"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-fetch";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Prize {
  id: string;
  type: string;
  label: string;
  weight: number;
  active: boolean;
  stockGlobal: number | null;
  remainingStock: number | null;
}

interface CampaignDetail {
  id: string;
  name: string;
  slug: string;
  status: string;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  prizes: Prize[];
  publicQrs: Array<{ id: string; slug: string; targetUrl: string; active: boolean }>;
  _count: { coupons: number; playSessions: number };
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadCampaign();
  }, []);

  async function loadCampaign() {
    try {
      const data = await adminFetch(`/api/admin/campaigns/${campaignId}`);
      setCampaign(data);
    } catch {
      /* error handled by adminFetch */
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(newStatus: string) {
    setActionLoading(true);
    try {
      await adminFetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      loadCampaign();
    } catch {
      /* error handled */
    } finally {
      setActionLoading(false);
    }
  }

  async function createQr() {
    setActionLoading(true);
    try {
      await adminFetch(`/api/admin/campaigns/${campaignId}/qr`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      loadCampaign();
    } catch {
      /* error handled */
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!campaign) return <p className="text-gray-500">Campagne introuvable</p>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">&larr;</button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{campaign.name}</h2>
          <p className="text-sm text-gray-500">/{campaign.slug}</p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {campaign.status === "DRAFT" && (
          <button onClick={() => toggleStatus("ACTIVE")} className="btn-success" disabled={actionLoading}>Activer</button>
        )}
        {campaign.status === "ACTIVE" && (
          <button onClick={() => toggleStatus("PAUSED")} className="btn-secondary" disabled={actionLoading}>Mettre en pause</button>
        )}
        {campaign.status === "PAUSED" && (
          <button onClick={() => toggleStatus("ACTIVE")} className="btn-success" disabled={actionLoading}>Reprendre</button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-500">Sessions</p>
          <p className="text-2xl font-bold">{campaign._count.playSessions}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Coupons</p>
          <p className="text-2xl font-bold">{campaign._count.coupons}</p>
        </div>
      </div>

      {/* Prizes */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Lots</h3>
        {campaign.prizes.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun lot configuré</p>
        ) : (
          <div className="space-y-2">
            {campaign.prizes.map((p) => (
              <div key={p.id} className={`card flex items-center justify-between ${!p.active ? "opacity-50" : ""}`}>
                <div>
                  <p className="font-medium">{p.label}</p>
                  <p className="text-xs text-gray-500">{p.type} · Poids: {p.weight}</p>
                </div>
                <div className="text-right text-sm">
                  {p.stockGlobal !== null && (
                    <p className="text-gray-500">Stock: {p.remainingStock}/{p.stockGlobal}</p>
                  )}
                  {!p.active && <p className="text-red-500 text-xs">Désactivé</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Public QR codes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">QR Codes publics</h3>
          <button onClick={createQr} className="btn-secondary text-sm" disabled={actionLoading}>
            + Nouveau QR
          </button>
        </div>
        {campaign.publicQrs.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun QR public. Créez-en un pour démarrer.</p>
        ) : (
          <div className="space-y-2">
            {campaign.publicQrs.map((qr) => (
              <div key={qr.id} className="card">
                <p className="font-mono text-sm text-gray-700 break-all">{qr.targetUrl}</p>
                <p className="text-xs text-gray-400 mt-1">Slug: {qr.slug}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
