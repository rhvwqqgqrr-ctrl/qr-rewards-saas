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

const PRIZE_TYPES = [
  { value: "FREE_PRODUCT", label: "Produit offert" },
  { value: "DISCOUNT_PERCENT", label: "Réduction %" },
  { value: "DISCOUNT_FIXED", label: "Réduction fixe (€)" },
  { value: "CUSTOM_REWARD", label: "Récompense personnalisée" },
  { value: "NO_PRIZE", label: "Perdu (pas de lot)" },
];

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPrizeForm, setShowPrizeForm] = useState(false);
  const [prizeForm, setPrizeForm] = useState({
    type: "FREE_PRODUCT",
    label: "",
    description: "",
    weight: 10,
    percentValue: null as number | null,
    fixedValue: null as number | null,
    stockGlobal: null as number | null,
  });

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

  async function createPrize() {
    setActionLoading(true);
    try {
      const payload: Record<string, unknown> = {
        type: prizeForm.type,
        label: prizeForm.label,
        weight: prizeForm.weight,
      };
      if (prizeForm.description) payload.description = prizeForm.description;
      if (prizeForm.type === "DISCOUNT_PERCENT" && prizeForm.percentValue !== null) {
        payload.percentValue = prizeForm.percentValue;
      }
      if (prizeForm.type === "DISCOUNT_FIXED" && prizeForm.fixedValue !== null) {
        payload.fixedValue = prizeForm.fixedValue;
      }
      if (prizeForm.stockGlobal !== null) payload.stockGlobal = prizeForm.stockGlobal;

      await adminFetch(`/api/admin/campaigns/${campaignId}/prizes`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setPrizeForm({ type: "FREE_PRODUCT", label: "", description: "", weight: 10, percentValue: null, fixedValue: null, stockGlobal: null });
      setShowPrizeForm(false);
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Lots</h3>
          <button onClick={() => setShowPrizeForm(!showPrizeForm)} className="btn-secondary text-sm">
            {showPrizeForm ? "Annuler" : "+ Ajouter un lot"}
          </button>
        </div>

        {showPrizeForm && (
          <div className="card mb-4 border-2 border-orange-200 bg-orange-50">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de lot</label>
                <select
                  value={prizeForm.type}
                  onChange={(e) => setPrizeForm({ ...prizeForm, type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {PRIZE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du lot</label>
                <input
                  type="text"
                  placeholder="Ex: Dessert offert, -10% sur l'addition..."
                  value={prizeForm.label}
                  onChange={(e) => setPrizeForm({ ...prizeForm, label: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
                <input
                  type="text"
                  placeholder="Détails supplémentaires..."
                  value={prizeForm.description}
                  onChange={(e) => setPrizeForm({ ...prizeForm, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              {prizeForm.type === "DISCOUNT_PERCENT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pourcentage de réduction</label>
                  <input
                    type="number"
                    min={0} max={100}
                    placeholder="10"
                    value={prizeForm.percentValue ?? ""}
                    onChange={(e) => setPrizeForm({ ...prizeForm, percentValue: e.target.value ? Number(e.target.value) : null })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}
              {prizeForm.type === "DISCOUNT_FIXED" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant de la réduction (€)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="5"
                    value={prizeForm.fixedValue ?? ""}
                    onChange={(e) => setPrizeForm({ ...prizeForm, fixedValue: e.target.value ? Number(e.target.value) : null })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Poids (probabilité relative)
                </label>
                <input
                  type="number"
                  min={0} max={1000}
                  value={prizeForm.weight}
                  onChange={(e) => setPrizeForm({ ...prizeForm, weight: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Plus le poids est élevé, plus le lot a de chances d&apos;être tiré</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock total (laisser vide = illimité)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="Illimité"
                  value={prizeForm.stockGlobal ?? ""}
                  onChange={(e) => setPrizeForm({ ...prizeForm, stockGlobal: e.target.value ? Number(e.target.value) : null })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={createPrize}
                disabled={actionLoading || !prizeForm.label}
                className="btn-success w-full"
              >
                {actionLoading ? "Création..." : "Créer le lot"}
              </button>
            </div>
          </div>
        )}

        {campaign.prizes.length === 0 && !showPrizeForm ? (
          <p className="text-gray-500 text-sm">Aucun lot configuré. Cliquez sur &quot;+ Ajouter un lot&quot; pour commencer.</p>
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
