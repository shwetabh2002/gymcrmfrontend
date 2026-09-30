/** Razorpay Checkout.js — in-page modal (not hosted payment links). */

export type RazorpayCheckoutOptions = {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
};

export type RazorpayCheckoutSuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay Checkout only runs in the browser"));
  }
  if (window.Razorpay) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${SCRIPT_SRC}"]`,
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Razorpay Checkout")),
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay Checkout"));
    document.body.appendChild(script);
  });
}

/**
 * Opens the standard Checkout modal on the current page.
 * Resolves on successful payment; rejects if the user closes or Razorpay errors.
 */
export async function openRazorpayCheckout(
  options: RazorpayCheckoutOptions,
): Promise<RazorpayCheckoutSuccess> {
  await loadCheckoutScript();
  if (!window.Razorpay) {
    throw new Error("Razorpay Checkout failed to initialize");
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: options.keyId,
      amount: options.amountPaise,
      currency: options.currency,
      name: options.name || "GymFlow",
      description: options.description || "Platform subscription",
      order_id: options.orderId,
      prefill: options.prefill || {},
      notes: options.notes || {},
      theme: { color: "#1b4fd8" },
      handler: (response: RazorpayCheckoutSuccess) => {
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          reject(new Error("Payment cancelled"));
        },
      },
    });

    rzp.on("payment.failed", (response: unknown) => {
      const err = (response as { error?: { description?: string } })?.error;
      reject(new Error(err?.description || "Payment failed"));
    });

    rzp.open();
  });
}
