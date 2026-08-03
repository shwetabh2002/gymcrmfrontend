"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route → unified Billing */
export default function PaymentsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/billing?tab=payments");
  }, [router]);
  return null;
}
