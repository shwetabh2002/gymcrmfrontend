import type { Metadata } from "next";
import "./marketing.css";

export const metadata: Metadata = {
  title: "GymFlow — Gym membership software",
  description:
    "Run renewals, payments, and members in one place. Start your gym CRM in minutes.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mkt">{children}</div>;
}
