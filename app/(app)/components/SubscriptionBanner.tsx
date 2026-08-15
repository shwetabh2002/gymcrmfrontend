"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { subscriptionApi } from "@/services/subscription/subscription.api";
import { useAuth } from "@/lib/context/AuthContext";

/**
 * Tells a gym where it stands with us, on every screen.
 *
 * Silent while the trial has room and nothing is wrong — a banner that is always
 * there stops being read. It appears in the last days of a trial, when a payment
 * has failed, and once the account has gone read-only.
 */
export default function SubscriptionBanner() {
  const { user, isAuthenticated } = useAuth();

  const { data } = useQuery({
    queryKey: ["subscription", "banner"],
    queryFn: subscriptionApi.mine,
    enabled: Boolean(isAuthenticated && user?.companyId),
    // Cheap and quiet: this only needs to be roughly current.
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (!data) return null;

  const tone = resolveTone(data);
  if (!tone) return null;

  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        padding: "10px 18px",
        borderRadius: 8,
        margin: "0 0 16px",
        background: tone.background,
        color: tone.color,
        border: `1px solid ${tone.border}`,
        fontSize: "0.9rem",
      }}
    >
      <span style={{ fontWeight: 600 }}>{tone.title}</span>
      <span style={{ opacity: 0.9 }}>{tone.detail}</span>
      <Link
        href="/settings/subscription"
        style={{
          marginLeft: "auto",
          padding: "5px 14px",
          borderRadius: 6,
          background: tone.color,
          color: tone.background,
          fontWeight: 600,
          fontSize: "0.85rem",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        {tone.cta}
      </Link>
    </div>
  );
}

type Tone = {
  title: string;
  detail: string;
  cta: string;
  background: string;
  color: string;
  border: string;
};

/** Null means "nothing worth interrupting them for". */
function resolveTone(data: {
  status: string;
  trialDaysLeft: number | null;
  planName: string;
  lastFailureReason: string | null;
}): Tone | null {
  if (data.status === "READ_ONLY" || data.status === "CANCELLED") {
    return {
      title:
        data.status === "CANCELLED"
          ? "Subscription cancelled"
          : "Your trial has ended",
      detail:
        "Your data is safe and still readable. Pick a plan to add members and take payments again.",
      cta: "Choose a plan",
      background: "#fdeaea",
      color: "#b3261e",
      border: "#f5c2c0",
    };
  }

  if (data.status === "PAST_DUE") {
    return {
      title: "Payment could not be collected",
      detail:
        data.lastFailureReason ||
        "We will retry shortly. Update your payment method to avoid interruption.",
      cta: "Fix payment",
      background: "#fff4e0",
      color: "#b26a00",
      border: "#f2d9a8",
    };
  }

  if (data.status === "TRIALING" && (data.trialDaysLeft ?? 99) <= 5) {
    const days = data.trialDaysLeft ?? 0;
    return {
      title:
        days <= 0
          ? "Your trial ends today"
          : `${days} day${days === 1 ? "" : "s"} left in your trial`,
      detail: `You are on ${data.planName}. Add a payment method to keep going without a break.`,
      cta: "Set up billing",
      background: "#eef4ff",
      color: "#1b4fd8",
      border: "#cddcfb",
    };
  }

  return null;
}
