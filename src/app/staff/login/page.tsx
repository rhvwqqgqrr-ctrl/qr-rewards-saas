"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/staff/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, restaurantSlug }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Identifiants invalides");

      localStorage.setItem("staff_token", json.data.token);
      localStorage.setItem("staff_user", JSON.stringify(json.data.user));
      localStorage.setItem("staff_restaurant", JSON.stringify(json.data.restaurant));
      router.push("/staff/scan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-500 text-sm mt-1">Connexion interface serveur</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant
            </label>
            <input
              type="text"
              value={restaurantSlug}
              onChange={(e) => setRestaurantSlug(e.target.value)}
              placeholder="ex: le-pare-faim"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@restaurant.fr"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
