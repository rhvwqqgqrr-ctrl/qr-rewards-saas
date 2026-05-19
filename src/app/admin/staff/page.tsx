"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface StaffMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
  createdAt: string;
  _count: { redeemedCoupons: number };
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("STAFF");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
    try {
      setStaff(await adminFetch("/api/admin/staff"));
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      await adminFetch("/api/admin/staff", {
        method: "POST",
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          name: newName || undefined,
          role: newRole,
        }),
      });
      setShowForm(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      loadStaff();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setFormLoading(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      await adminFetch(`/api/admin/staff/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !active }),
      });
      loadStaff();
    } catch {
      /* handled */
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Staff</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Annuler" : "+ Nouveau"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateStaff} className="card mb-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" className="input-field" required />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mot de passe (min 8)" className="input-field" required minLength={8} />
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom (optionnel)" className="input-field" />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="input-field">
              <option value="STAFF">Staff</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
          <button type="submit" className="btn-primary" disabled={formLoading}>
            {formLoading ? <LoadingSpinner size="sm" /> : "Créer le compte"}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {staff.map((s) => (
          <div key={s.id} className={`card flex items-center justify-between ${!s.active ? "opacity-50" : ""}`}>
            <div>
              <p className="font-medium">{s.name || s.email}</p>
              <p className="text-sm text-gray-500">{s.email} · {s.role}</p>
              <p className="text-xs text-gray-400">{s._count.redeemedCoupons} validations</p>
            </div>
            <button
              onClick={() => toggleActive(s.id, s.active)}
              className={`text-sm font-medium ${s.active ? "text-red-600" : "text-emerald-600"}`}
            >
              {s.active ? "Désactiver" : "Activer"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
