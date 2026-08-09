"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * Renders a payment link as a QR the member can scan with any UPI app.
 *
 * Generated in the browser — the link never leaves the device, unlike the
 * third-party QR image service this replaces.
 */
export default function PaymentQr({
  value,
  size = 200,
  alt = "Payment QR",
}: {
  value: string;
  size?: number;
  alt?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!value) return;
    let cancelled = false;

    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (failed) {
    return (
      <p style={{ fontSize: "0.85rem", color: "var(--text-2)" }}>
        QR could not be generated — share the link instead.
      </p>
    );
  }

  if (!dataUrl) {
    return (
      <div
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          background: "var(--surface-2, rgba(127,127,127,.12))",
        }}
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element -- data: URI, no loader needed
  return <img src={dataUrl} alt={alt} width={size} height={size} />;
}
