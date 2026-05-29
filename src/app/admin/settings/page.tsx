"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function SettingsPage() {
  const [restaurant, setRestaurant] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRestaurant();
  }, []);

  async function loadRestaurant() {
    try {
      setRestaurant(await adminFetch("/api/admin/restaurant"));
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");
    try {
      await adminFetch("/api/admin/restaurant", {
        method: "PATCH",
        body: JSON.stringify({
          name: restaurant.name,
          googleReviewUrl: restaurant.googleReviewUrl || null,
          primaryColor: restaurant.primaryColor,
          secondaryColor: restaurant.secondaryColor,
          phone: restaurant.phone,
          websiteUrl: restaurant.websiteUrl || null,
        }),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  const update = (key: string, value: string) =>
    setRestaurant((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Paramètres restaurant</h2>
      <form onSubmit={handleSave} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input type="text" value={restaurant.name || ""} onChange={(e) => update("name", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input type="text" value={restaurant.phone || ""} onChange={(e) => update("phone", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL avis Google</label>
          <input type="url" value={restaurant.googleReviewUrl || ""} onChange={(e) => update("googleReviewUrl", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
          <input type="url" value={restaurant.websiteUrl || ""} onChange={(e) => update("websiteUrl", e.target.value)} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Couleur principale</label>
            <input type="color" value={restaurant.primaryColor || "#d6822e"} onChange={(e) => update("primaryColor", e.target.value)} className="h-10 w-full rounded-lg cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Couleur secondaire</label>
            <input type="color" value={restaurant.secondaryColor || "#3a1b0e"} onChange={(e) => update("secondaryColor", e.target.value)} className="h-10 w-full rounded-lg cursor-pointer" />
          </div>
        </div>
        {success && <p className="text-emerald-600 text-sm font-medium">Enregistré avec succès !</p>}
        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? <LoadingSpinner size="sm" /> : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
