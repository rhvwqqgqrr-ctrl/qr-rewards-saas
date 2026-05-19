"use client";

import { useEffect, useState } from "react";
import { platformFetch } from "@/lib/platform-fetch";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface AuditEvent {
  id: string;
  actorType: string;
  actorId: string | null;
  entityType: string;
  entityId: string;
  eventType: string;
  payloadJson: Record<string, unknown> | null;
  createdAt: string;
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadEvents();
  }, [page]);

  async function loadEvents() {
    setLoading(true);
    try {
      const data = await platformFetch(`/api/platform/audit?page=${page}&limit=30`);
      setEvents(data.events);
      setTotalPages(data.pagination.totalPages);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }

  if (loading && events.length === 0) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Audit Log</h2>

      <div className="space-y-2">
        {events.map((ev) => (
          <div key={ev.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-brand-400">{ev.eventType}</span>
              <span className="text-xs text-gray-500">
                {new Date(ev.createdAt).toLocaleString("fr-FR")}
              </span>
            </div>
            <p className="text-sm text-gray-300">
              {ev.actorType} → {ev.entityType}/{ev.entityId.slice(0, 8)}...
            </p>
            {ev.payloadJson && (
              <pre className="text-xs text-gray-500 mt-2 overflow-x-auto">
                {JSON.stringify(ev.payloadJson, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg border border-gray-700 text-sm disabled:opacity-50">
            Précédent
          </button>
          <span className="px-4 py-2 text-sm text-gray-400">{page} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg border border-gray-700 text-sm disabled:opacity-50">
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
