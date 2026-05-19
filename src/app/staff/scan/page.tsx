"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatusBadge from "@/components/ui/StatusBadge";

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
  isRedeemable: boolean;
}

export default function StaffScanPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [coupon, setCoupon] = useState<CouponInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [staffToken, setStaffToken] = useState<string | null>(null);
  const [staffUser, setStaffUser] = useState<{ name: string | null } | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("staff_token");
    const u = localStorage.getItem("staff_user");
    if (!t) {
      router.push("/staff/login");
      return;
    }
    setStaffToken(t);
    if (u) setStaffUser(JSON.parse(u));

    // Check if URL has a token parameter (from QR scan)
    const urlParams = new URLSearchParams(window.location.search);
    const redeemToken = urlParams.get("token");
    if (redeemToken) {
      handleScanToken(redeemToken);
    }
  }, []);

  async function handleScanToken(redeemToken: string) {
    if (!staffToken) return;
    setLoading(true);
    setError("");
    setCoupon(null);
    setSuccess("");

    try {
      const res = await fetch("/api/staff/redeem/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({ token: redeemToken }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Token invalide");
      setCoupon(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de scan");
    } finally {
      setLoading(false);
    }
  }

  async function handleManualLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!staffToken || !manualCode.trim()) return;
    setLoading(true);
    setError("");
    setCoupon(null);
    setSuccess("");

    try {
      const res = await fetch("/api/staff/coupon/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({ humanCode: manualCode.trim().toUpperCase() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Code introuvable");
      setCoupon({
        ...json.data,
        isRedeemable: json.data.status === "ACTIVE" && !json.data.redeemedAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de recherche");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmRedeem() {
    if (!staffToken || !coupon) return;
    setConfirming(true);
    setError("");

    try {
      const res = await fetch("/api/staff/redeem/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({ couponId: coupon.couponId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Erreur de validation");

      setSuccess(`✅ ${coupon.prize.label} — validé avec succès !`);
      setCoupon(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de validation");
    } finally {
      setConfirming(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("staff_token");
    localStorage.removeItem("staff_user");
    localStorage.removeItem("staff_restaurant");
    router.push("/staff/login");
  }

  function resetScan() {
    setCoupon(null);
    setError("");
    setSuccess("");
    setManualCode("");
    setToken("");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-gray-900">Scanner</h1>
          {staffUser?.name && (
            <p className="text-xs text-gray-500">{staffUser.name}</p>
          )}
        </div>
        <button onClick={handleLogout} className="text-sm text-red-600 font-medium">
          Déconnexion
        </button>
      </header>

      <div className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Success message */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-center">
            <p className="font-semibold text-lg">{success}</p>
            <button onClick={resetScan} className="btn-primary mt-4 w-full">
              Nouveau scan
            </button>
          </div>
        )}

        {/* Manual code input */}
        {!coupon && !success && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Saisie manuelle du code</h2>
            <form onSubmit={handleManualLookup} className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="XXXX-XXXX"
                className="input-field flex-1 font-mono uppercase"
                maxLength={9}
              />
              <button type="submit" className="btn-primary px-4" disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : "Chercher"}
              </button>
            </form>
          </div>
        )}

        {/* Scan via URL input (fallback for no camera API) */}
        {!coupon && !success && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Scanner un QR (coller le lien)</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Collez le token du QR ici"
                className="input-field flex-1 text-sm"
              />
              <button
                onClick={() => handleScanToken(token)}
                className="btn-primary px-4"
                disabled={loading || !token}
              >
                OK
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Scannez le QR du client avec l&apos;appareil photo, puis collez l&apos;URL ici si nécessaire.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center">
            <p>{error}</p>
            <button onClick={resetScan} className="text-sm underline mt-2">
              Réessayer
            </button>
          </div>
        )}

        {/* Coupon details */}
        {coupon && (
          <div className="card">
            <div className="text-center mb-4">
              <StatusBadge status={coupon.status} />
            </div>

            <div className="bg-brand-50 rounded-xl p-4 mb-4 text-center">
              <p className="text-xl font-bold text-brand-800">{coupon.prize.label}</p>
              {coupon.prize.description && (
                <p className="text-sm text-brand-600 mt-1">{coupon.prize.description}</p>
              )}
            </div>

            <div className="text-sm text-gray-600 space-y-2 mb-6">
              <div className="flex justify-between">
                <span>Code :</span>
                <span className="font-mono font-semibold">{coupon.humanCode}</span>
              </div>
              <div className="flex justify-between">
                <span>Valable du :</span>
                <span className="font-semibold">
                  {new Date(coupon.activationAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Expire le :</span>
                <span className="font-semibold">
                  {new Date(coupon.expiresAt).toLocaleDateString("fr-FR")}
                </span>
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

            {coupon.isRedeemable ? (
              <button
                onClick={handleConfirmRedeem}
                className="btn-success w-full text-lg py-4"
                disabled={confirming}
              >
                {confirming ? <LoadingSpinner size="sm" /> : "✅ Valider le gain"}
              </button>
            ) : (
              <div className="text-center">
                {coupon.status === "REDEEMED" && (
                  <p className="text-blue-600 font-medium">Ce coupon a déjà été utilisé</p>
                )}
                {coupon.status === "EXPIRED" && (
                  <p className="text-red-600 font-medium">Ce coupon a expiré</p>
                )}
                {coupon.status === "ISSUED" && (
                  <p className="text-yellow-600 font-medium">
                    Ce coupon n&apos;est pas encore actif. Il sera valable à partir de demain.
                  </p>
                )}
                {coupon.status === "CANCELLED" && (
                  <p className="text-gray-600 font-medium">Ce coupon a été annulé</p>
                )}
                {coupon.status === "FRAUD_FLAGGED" && (
                  <p className="text-red-700 font-medium">Ce coupon est signalé comme suspect</p>
                )}
              </div>
            )}

            <button onClick={resetScan} className="btn-secondary w-full mt-3">
              Nouveau scan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
