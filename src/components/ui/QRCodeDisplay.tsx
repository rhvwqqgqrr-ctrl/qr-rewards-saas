"use client";

import { useEffect, useState } from "react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  label?: string;
}

export default function QRCodeDisplay({ value, size = 200, label }: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    // Dynamically import qrcode to generate real scannable QR codes
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(value, {
        width: size,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: "M",
      }).then((url: string) => setDataUrl(url));
    }).catch(() => {
      // Fallback: use a free QR code API if the library fails
      setDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`);
    });
  }, [value, size]);

  function handleDownload() {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `qr-code-${label || "download"}.png`;
    link.href = dataUrl;
    link.click();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-gray-100">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={`QR Code: ${label || value}`} width={size} height={size} />
        ) : (
          <div style={{ width: size, height: size }} className="flex items-center justify-center text-gray-400 text-sm">
            Génération...
          </div>
        )}
      </div>
      {label && (
        <p className="text-sm text-gray-500 font-mono tracking-wider">{label}</p>
      )}
      {dataUrl && (
        <button onClick={handleDownload} className="text-sm text-orange-600 hover:text-orange-800 underline">
          Télécharger le QR code
        </button>
      )}
    </div>
  );
}
