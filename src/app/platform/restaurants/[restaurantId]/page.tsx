"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { platformFetch } from "@/lib/platform-fetch";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface RestaurantDetail {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  status: string;
  primaryColor: string;
  secondaryColor: string;
  googleReviewUrl: string | null;
  timezone: string;
  campaigns: Array<{ id: string; name: string; slug: string; status: string }>;
  users: Array<{ id: string; email: string; name: string | null; role: string; active: boolean }>;
  _count: { coupons: number };
}

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.restaurantId as string;
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    platformFetch(`/api/platform/restaurants/${restaurantId}`)
      .then(setRestaurant)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [restaurantId]);

  async function toggleStatus(status: string) {
    try {
      await platformFetch(`/api/platform/restaurants/${restaurantId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      const data = await platformFetch(`/api/platform/restaurants/${restaurantId}`);
      setRestaurant(data);
    } catch {
      /* handled */
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!restaurant) return <p className="text-gray-400">Restaurant introuvable</p>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">&larr;</button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">{restaurant.name}</h2>
          <p className="text-sm text-gray-400">{restaurant.city} · /{restaurant.slug}</p>
        </div>
        <StatusBadge status={restaurant.status} />
      </div>

      <div className="flex gap-2 mb-6">
        {restaurant.status === "ACTIVE" ? (
          <button onClick={() => toggleStatus("SUSPENDED")} className="btn-danger text-sm">Suspendre</button>
        ) : (
          <button onClick={() => toggleStatus("ACTIVE")} className="btn-success text-sm">Activer</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Coupons</p>
          <p className="text-2xl font-bold text-white">{restaurant._count.coupons}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Campagnes</p>
          <p className="text-2xl font-bold text-white">{restaurant.campaigns.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Utilisateurs</p>
          <p className="text-2xl font-bold text-white">{restaurant.users.length}</p>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-3">Campagnes</h3>
      <div className="space-y-2 mb-6">
        {restaurant.campaigns.map((c) => (
          <div key={c.id} className="bg-gray-800 rounded-xl p-3 border border-gray-700 flex items-center justify-between">
            <span className="text-white">{c.name}</span>
            <StatusBadge status={c.status} />
          </div>
        ))}
      </div>

      <h3 className="text-lg font-semibold text-white mb-3">Utilisateurs</h3>
      <div className="space-y-2">
        {restaurant.users.map((u) => (
          <div key={u.id} className="bg-gray-800 rounded-xl p-3 border border-gray-700 flex items-center justify-between">
            <div>
              <p className="text-white">{u.name || u.email}</p>
              <p className="text-sm text-gray-400">{u.role} · {u.active ? "Actif" : "Inactif"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
