"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatusBadge from "@/components/ui/StatusBadge";
import ErrorMessage from "@/components/ui/ErrorMessage";

interface CouponInfo {
  couponId: string;
  humanCode: string;
  status: string;
  prize: {
    type: string;
    label: string;
    description: string | null;
    percentValue: number | null;
    fixedValue: number | null;
  };
  activationAt: string;
  expiresAt: string;
  redeemedAt: string | null;
  restaurant: { name: string; slug: string; timezone: string };
  campaign: { name: string; slug: string };
  isRedeemable: boolean;
}

export default function RedeemPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState<CouponInfo | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCoupon();
  }, []);

  async function fetchCoupon() {
    try {
      const res = await fetch(`/api/public/redeem/${encodeURIComponent(token)}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Token invalide");
      setCoupon(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage title="Coupon invalide" message={error} />;
  }

  if (!coupon) return null;

  const activationDate = new Date(coupon.activationAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const expirationDate = new Date(coupon.expiresAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="card w-full max-w-sm text-center">
        <h1 className="font-display text-xl font-bold mb-1">{coupon.restaurant.name}</h1>
        <p className="text-sm text-gray-500 mb-4">{coupon.campaign.name}</p>

        <div className="mb-4">
          <StatusBadge status={coupon.status} />
        </div>

        <div className="bg-brand-50 rounded-xl p-4 mb-4">
          <p className="text-lg font-bold text-brand-800">{coupon.prize.label}</p>
          {coupon.prize.description && (
            <p className="text-sm text-brand-600 mt-1">{coupon.prize.description}</p>
          )}
        </div>

        <div className="text-sm text-gray-600 space-y-2 mb-4">
          <div className="flex justify-between">
            <span>Code :</span>
            <span className="font-mono font-semibold">{coupon.humanCode}</span>
          </div>
          <div className="flex justify-between">
            <span>Valable du :</span>
            <span className="font-semibold">{activationDate}</span>
          </div>
          <div className="flex justify-between">
            <span>Jusqu&apos;au :</span>
            <span className="font-semibold">{expirationDate}</span>
          </div>
          {coupon.redeemedAt && (
            <div className="flex justify-between text-blue-600">
              <span>Utilisé le :</span>
              <span className="font-semibold">
                {new Date(coupon.redeemedAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
          )}
        </div>

        {coupon.isRedeemable && (
          <p className="text-xs text-emerald-600 font-medium">
            ✅ Ce coupon est valide — présentez-le à votre serveur
          </p>
        )}
        {coupon.status === "REDEEMED" && (
          <p className="text-xs text-blue-600 font-medium">
            ✓ Ce coupon a déjà été utilisé
          </p>
        )}
        {coupon.status === "EXPIRED" && (
          <p className="text-xs text-red-600 font-medium">
            ✗ Ce coupon a expiré
          </p>
        )}
      </div>
    </div>
  );
}
