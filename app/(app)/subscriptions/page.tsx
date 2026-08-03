"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route → unified Billing */
export default function SubscriptionsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/billing?tab=memberships");
  }, [router]);
  return null;
}
