"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import RouletteWheel from "@/components/roulette/RouletteWheel";
import QRCodeDisplay from "@/components/ui/QRCodeDisplay";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

type GamePhase = "loading" | "landing" | "review" | "spinning" | "result" | "coupon" | "error";

interface CampaignData {
  restaurant: {
    name: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    googleReviewUrl: string | null;
  };
  campaign: {
    name: string;
    slug: string;
    description: string | null;
    prizes: Array<{ id: string; type: string; label: string; description: string | null; displayOrder: number }>;
  };
}

interface SpinResult {
  won: boolean;
  prize: { id: string; type: string; label: string; description: string | null };
  coupon?: {
    humanCode: string;
    activationAt: string;
    expiresAt: string;
    redemptionToken: string;
  };
}

export default function PlayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const restaurantSlug = params.restaurantSlug as string;
  const campaignSlug = params.campaignSlug as string;
  const qrSlug = searchParams.get("qr") || undefined;

  const [phase, setPhase] = useState<GamePhase>("loading");
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState<string>("");
  const [spinning, setSpinning] = useState(false);
  const [winningIndex, setWinningIndex] = useState(0);
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    loadCampaign();
  }, []);

  async function loadCampaign() {
    try {
      const res = await fetch(`/api/public/restaurants/${restaurantSlug}/campaigns/${campaignSlug}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Campagne introuvable");
      setCampaignData(json.data);

      // Start session
      const sessionRes = await fetch("/api/public/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantSlug,
          campaignSlug,
          publicQrSlug: qrSlug,
        }),
      });
      const sessionJson = await sessionRes.json();
      if (!sessionJson.success) throw new Error(sessionJson.error?.message || "Erreur de session");
      setSessionToken(sessionJson.data.sessionToken);
      setPhase("landing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      setPhase("error");
    }
  }

  async function handleReviewClick() {
    if (!sessionToken || !campaignData?.restaurant.googleReviewUrl) return;

    try {
      await fetch("/api/public/review/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      });
      window.open(campaignData.restaurant.googleReviewUrl, "_blank");
      setReviewDone(true);
      setPhase("review");
    } catch {
      // Non-blocking
      window.open(campaignData.restaurant.googleReviewUrl, "_blank");
      setReviewDone(true);
      setPhase("review");
    }
  }

  async function handleReturnFromReview() {
    if (!sessionToken) return;
    try {
      await fetch("/api/public/review/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      });
    } catch {
      // Non-blocking
    }
    setPhase("landing");
  }

  async function handleSpin() {
    if (!sessionToken) return;

    try {
      // Step 1: Call API to get the result FIRST
      const res = await fetch("/api/public/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Erreur lors du tirage");

      const result: SpinResult = json.data;
      setSpinResult(result);

      // Step 2: Find winning index
      const prizes = campaignData?.campaign.prizes || [];
      const idx = prizes.findIndex((p) => p.id === result.prize.id);
      const resolvedIndex = idx >= 0 ? idx : 0;
      setWinningIndex(resolvedIndex);

      // Step 3: NOW show the spinning phase and start animation
      setPhase("spinning");
      setSpinning(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur du tirage");
      setSpinning(false);
      setPhase("error");
    }
  }

  function handleSpinComplete() {
    setSpinning(false);
    if (spinResult?.won) {
      setPhase("coupon");
    } else {
      setPhase("result");
    }
  }

  const restaurant = campaignData?.restaurant;
  const campaign = campaignData?.campaign;
  const primaryColor = restaurant?.primaryColor || "#d6822e";

  // ─── Loading ───────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────
  if (phase === "error") {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }

  // ─── Landing ───────────────────────────────────────────
  if (phase === "landing") {
    const hasReviewUrl = !!restaurant?.googleReviewUrl;
    const canPlay = !hasReviewUrl || reviewDone;

    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          {restaurant?.logoUrl && (
            <img
              src={restaurant.logoUrl}
              alt={restaurant.name}
              className="h-20 w-auto mb-6 rounded-xl"
            />
          )}
          <h1 className="font-display text-3xl font-bold text-center mb-2" style={{ color: primaryColor }}>
            {restaurant?.name}
          </h1>
          <p className="text-gray-600 text-center mb-2">{campaign?.name}</p>
          {campaign?.description && (
            <p className="text-gray-500 text-center text-sm mb-8 max-w-xs">
              {campaign.description}
            </p>
          )}

          <div className="w-full max-w-xs space-y-4">
            {!canPlay ? (
              <>
                <p className="text-center text-gray-700 text-sm mb-2">
                  Laissez un avis Google pour débloquer votre tirage au sort !
                </p>
                <button onClick={handleReviewClick} className="btn-primary w-full text-lg py-4">
                  ⭐ Laisser un avis Google
                </button>
              </>
            ) : (
              <>
                {reviewDone && (
                  <p className="text-center text-emerald-600 font-semibold text-sm mb-2">
                    Merci pour votre avis ! Vous pouvez maintenant jouer.
                  </p>
                )}
                <button onClick={handleSpin} className="btn-primary w-full text-lg py-4">
                  🎰 Tenter ma chance !
                </button>
              </>
            )}
          </div>
        </div>

        <footer className="text-center py-4 text-xs text-gray-400">
          Propulsé par QR Rewards
        </footer>
      </div>
    );
  }

  // ─── Review redirect ───────────────────────────────────
  if (phase === "review") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-brand-50 to-white">
        <div className="text-center max-w-xs">
          <div className="text-5xl mb-4">🙏</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Merci pour votre avis !</h2>
          <p className="text-gray-600 mb-6">
            Votre avis compte beaucoup pour nous. Vous avez maintenant accès au tirage au sort !
          </p>
          <button onClick={handleReturnFromReview} className="btn-primary w-full text-lg py-4">
            🎰 Jouer maintenant !
          </button>
        </div>
      </div>
    );
  }

  // ─── Spinning ──────────────────────────────────────────
  if (phase === "spinning") {
    const displayPrizes = campaign?.prizes || [];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-brand-50 to-white">
        <h2 className="font-display text-2xl font-bold mb-8" style={{ color: primaryColor }}>
          La roue tourne...
        </h2>
        <RouletteWheel
          prizes={displayPrizes}
          onSpinComplete={handleSpinComplete}
          winningIndex={winningIndex}
          spinning={spinning}
          primaryColor={primaryColor}
        />
        <p className="mt-6 text-gray-500 text-sm animate-pulse">
          Bonne chance ! 🍀
        </p>
      </div>
    );
  }

  // ─── Lost result ───────────────────────────────────────
  if (phase === "result" && spinResult && !spinResult.won) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center max-w-xs">
          <div className="text-6xl mb-6">😔</div>
          <h2 className="font-display text-2xl font-bold text-gray-800 mb-3">
            Pas de chance cette fois !
          </h2>
          <p className="text-gray-600 mb-8">
            Revenez vite tenter votre chance une prochaine fois.
          </p>
          {restaurant?.googleReviewUrl && (
            <a
              href={restaurant.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full block text-center"
            >
              ⭐ Laisser un avis
            </a>
          )}
        </div>
      </div>
    );
  }

  // ─── Won — Coupon display ──────────────────────────────
  if (phase === "coupon" && spinResult?.won && spinResult.coupon) {
    const coupon = spinResult.coupon;
    const appUrl = typeof window !== "undefined" ? window.location.origin : "";
    const redemptionUrl = `${appUrl}/redeem/${coupon.redemptionToken}`;

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
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 to-white">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="font-display text-2xl font-bold text-emerald-800 mb-2 text-center">
            Félicitations !
          </h2>
          <p className="text-lg text-emerald-700 font-semibold mb-6 text-center">
            {spinResult.prize.label}
          </p>

          <div className="card w-full max-w-sm text-center mb-6">
            <QRCodeDisplay
              value={redemptionUrl}
              size={200}
              label={coupon.humanCode}
            />
          </div>

          <div className="bg-white rounded-xl border border-emerald-200 p-4 w-full max-w-sm">
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Code :</span>
                <span className="font-mono font-semibold text-gray-900">{coupon.humanCode}</span>
              </div>
              <div className="flex justify-between">
                <span>Valable du :</span>
                <span className="font-semibold text-gray-900">{activationDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Jusqu&apos;au :</span>
                <span className="font-semibold text-gray-900">{expirationDate}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-6 text-center max-w-xs">
            Présentez ce QR code à votre serveur lors de votre prochaine visite pour profiter de votre récompense.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
