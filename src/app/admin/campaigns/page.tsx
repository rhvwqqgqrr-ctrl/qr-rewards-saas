"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Campaign {
  id: string;
  name: string;
  slug: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  _count: { prizes: number; publicQrs: number; coupons: number };
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      const data = await adminFetch("/api/admin/campaigns");
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Campagnes</h2>
        <Link href="/admin/campaigns/new" className="btn-primary">
          + Nouvelle campagne
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Aucune campagne. Créez votre première campagne !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/admin/campaigns/${c.id}`}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{c.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">/{c.slug}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                <span>{c._count.prizes} lots</span>
                <span>{c._count.coupons} coupons</span>
                <span>{c._count.publicQrs} QR</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
