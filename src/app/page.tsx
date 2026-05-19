import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-display text-4xl font-bold text-brand-950 mb-4">
          QR Rewards
        </h1>
        <p className="text-lg text-brand-800 mb-8">
          Plateforme de fidélisation par QR code pour restaurants
        </p>
        <div className="space-y-3">
          <Link
            href="/admin/login"
            className="btn-primary w-full block text-center"
          >
            Back-office restaurant
          </Link>
          <Link
            href="/staff/login"
            className="btn-secondary w-full block text-center"
          >
            Interface staff
          </Link>
          <Link
            href="/platform/login"
            className="btn-secondary w-full block text-center"
          >
            Administration plateforme
          </Link>
        </div>
      </div>
    </div>
  );
}