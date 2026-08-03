"use client";

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useUpdateMemberSubscription } from "@/services/subscriptions/subscriptions.hook";
import { MemberSubscription } from "@/services/subscriptions/subscriptions.api";
import { formatAmountWithGstInline, resolveInvoiceTax } from "@/lib/tax";
import { useGymSettings } from "@/services/gym-settings/gym-settings.hooks";
import toast from "react-hot-toast";
import styles from "./Billing.module.css";

function getMember(sub: MemberSubscription) {
  return typeof sub.memberId === "object" && sub.memberId !== null
    ? sub.memberId
    : null;
}

function getPlan(sub: MemberSubscription) {
  return typeof sub.planId === "object" && sub.planId !== null
    ? sub.planId
    : null;
}

export function CancelMembershipModal({
  subscription,
  onClose,
}: {
  subscription: MemberSubscription;
  onClose: () => void;
}) {
  const { mutateAsync: updateSub, isPending } = useUpdateMemberSubscription();
  const { data: gymSettings } = useGymSettings();
  const { taxPercentage, taxMode } = resolveInvoiceTax(gymSettings);

  const member = getMember(subscription);
  const plan = getPlan(subscription);

  const handleCancel = async () => {
    try {
      await updateSub({
        id: subscription._id,
        payload: { subscriptionStatus: "CANCELLED" },
      });
      toast.success("Membership cancelled");
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Cancel failed");
    }
  };

  return createPortal(
    <>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className={styles.modal}
        style={{ width: 420 }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Cancel membership</h2>
          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className={styles.formGrid} style={{ marginTop: 12 }}>
          <p className={styles.confirmLead}>
            Review details, then confirm cancel.
          </p>

          <dl className={styles.confirmDetails}>
            <div>
              <dt>Member</dt>
              <dd>
                {member?.name ?? "—"}
                {(member?.contactNumber ?? member?.phone) ? (
                  <span className={styles.confirmMuted}>
                    {" "}
                    · {member?.contactNumber ?? member?.phone}
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt>Plan</dt>
              <dd>{plan?.name ?? "—"}</dd>
            </div>
            <div>
              <dt>Period</dt>
              <dd>
                {new Date(subscription.startDate).toLocaleDateString("en-IN")} →{" "}
                {new Date(subscription.expiryDate).toLocaleDateString("en-IN")}
              </dd>
            </div>
            <div>
              <dt>Paid</dt>
              <dd>
                {formatAmountWithGstInline(
                  subscription.totalPaid,
                  taxPercentage,
                  taxMode,
                )}
              </dd>
            </div>
            <div>
              <dt>Pending</dt>
              <dd>
                {formatAmountWithGstInline(
                  subscription.pendingAmount,
                  taxPercentage,
                  taxMode,
                )}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{subscription.subscriptionStatus}</dd>
            </div>
          </dl>

          <p className={styles.confirmWarn}>
            Plan becomes cancelled. Assign a new one later via Sell / Renew.
            Past payments stay in history.
          </p>
        </div>

        <div className={styles.modalFooter} style={{ marginTop: 16 }}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={isPending}
          >
            Keep
          </button>
          <button
            type="button"
            className={styles.btnDanger}
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending ? "Cancelling…" : "Cancel membership"}
          </button>
        </div>
      </motion.div>    </>,
    document.body,
  );
}
