const statusConfig: Record<string, { className: string; label: string }> = {
  ISSUED: { className: "badge-issued", label: "Émis" },
  ACTIVE: { className: "badge-active", label: "Actif" },
  EXPIRED: { className: "badge-expired", label: "Expiré" },
  REDEEMED: { className: "badge-redeemed", label: "Utilisé" },
  CANCELLED: { className: "badge bg-gray-100 text-gray-800", label: "Annulé" },
  FRAUD_FLAGGED: { className: "badge bg-red-200 text-red-900", label: "Suspect" },
  DRAFT: { className: "badge bg-gray-100 text-gray-600", label: "Brouillon" },
  PAUSED: { className: "badge bg-yellow-100 text-yellow-800", label: "En pause" },
  ENDED: { className: "badge bg-gray-200 text-gray-700", label: "Terminée" },
  ARCHIVED: { className: "badge bg-gray-100 text-gray-500", label: "Archivée" },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || {
    className: "badge bg-gray-100 text-gray-600",
    label: status,
  };

  return <span className={config.className}>{config.label}</span>;
}