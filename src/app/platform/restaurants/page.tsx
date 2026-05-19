"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { platformFetch } from "@/lib/platform-fetch";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  status: string;
  createdAt: string;
  _count: { campaigns: number; users: number; coupons: number };
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", slug: "", city: "" });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function loadRestaurants() {
    try {
      setRestaurants(await platformFetch("/api/platform/restaurants"));
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    try {
      await platformFetch("/api/platform/restaurants", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          city: formData.city || undefined,
        }),
      });
      setShowForm(false);
      setFormData({ name: "", slug: "", city: "" });
      loadRestaurants();
    } catch {
      /* handled */
    } finally {
      setFormLoading(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Restaurants</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Annuler" : "+ Nouveau restaurant"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6 space-y-3">
          <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nom du restaurant" className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white" required />
          <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="Slug (auto-généré si vide)" className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white font-mono" />
          <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Ville" className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white" />
          <button type="submit" className="btn-primary" disabled={formLoading}>
            {formLoading ? <LoadingSpinner size="sm" /> : "Créer"}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {restaurants.map((r) => (
          <Link key={r.id} href={`/platform/restaurants/${r.id}`} className="block bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{r.name}</p>
                <p className="text-sm text-gray-400">{r.city} · /{r.slug}</p>
                <p className="text-xs text-gray-500 mt-1">{r._count.campaigns} campagnes · {r._count.users} users · {r._count.coupons} coupons</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${r.status === "ACTIVE" ? "bg-emerald-900/50 text-emerald-400" : "bg-red-900/50 text-red-400"}`}>
                {r.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
