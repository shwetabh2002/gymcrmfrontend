"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateMember, useUpdateMember } from "@/services/members/members.hook";
import { Member, CreateMemberPayload, RegisterMemberPayload } from "@/services/members/members.api";
import { useEmployees } from "@/services/employees/employees.hook";
import styles from "./MemberModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: Member | null;
}

const EMPTY: CreateMemberPayload = {
  idNo: "",
  date: new Date().toISOString().split('T')[0],
  name: "",
  contactNumber: "",
  phone: "",
  email: "",
  dob: "",
  anniversaryDate: "",
  instagramHandle: "",
  membershipPlan: "",
  membershipMonths: 1,
  amount: 0,
  membershipAmount: 0,
  received: 0,
  pending: 0,
  mop: "cash",
  transactionId: "",
  salesPerson: "",
  trainingType: "GT",
  trainer: "",
  memberType: "New",
  startingDate: new Date().toISOString().split('T')[0],
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  memberStatus: "ACTIVE",
  address: "",
  emergencyContact: "",
  discountAmount: 0,
  discountApprovedBy: "",
};

const COUNTRY_CODES = [
  { code: "+91", country: "India" },
  { code: "+1", country: "USA/Canada" },
  { code: "+44", country: "UK" },
  { code: "+971", country: "UAE" },
  { code: "+65", country: "Singapore" },
  { code: "+61", country: "Australia" },
];

// Membership plan pricing (update these with actual website prices)
const MEMBERSHIP_PLANS = [
  { months: 1, label: "1 Month", price: 3000 },
  { months: 3, label: "3 Months", price: 8000 },
  { months: 6, label: "6 Months", price: 15000 },
  { months: 12, label: "12 Months", price: 28000 },
];

// Fixed approvers for discount
const APPROVERS = ["Mannu Rawat", "Suman Upadhyaya"];

export default function MemberModal({ open, onClose, existing }: Props) {
  const isEdit = !!existing;
  const [form, setForm]   = useState<CreateMemberPayload>(EMPTY);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [hasDiscount, setHasDiscount] = useState(false);

  const { mutate: createMember, isPending: creating } = useCreateMember();
  const { mutate: updateMember, isPending: updating } = useUpdateMember();
  // Only fetch employees if modal is open (and handle errors silently if section is locked)
  const { data: employees, isError: employeesError } = useEmployees();
  const isPending = creating || updating;

  // Filter employees by type (return empty array if error/locked)
  const salesEmployees = (!employeesError && employees?.filter(emp => emp.employeeType === "SALES" && emp.status === "ACTIVE")) || [];
  const trainerEmployees = (!employeesError && employees?.filter(emp => emp.employeeType === "TRAINER" && emp.status === "ACTIVE")) || [];

  // Handle membership plan selection - auto-fill price
  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const months = parseInt(e.target.value);
    const selectedPlan = MEMBERSHIP_PLANS.find(p => p.months === months);
    if (selectedPlan) {
      setForm(prev => ({
        ...prev,
        membershipMonths: months,
        membershipPlan: selectedPlan.label,
        amount: selectedPlan.price,
        membershipAmount: selectedPlan.price,
      }));
    }
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (existing) {
      // Get active membership info, fallback to paymentSummary or direct fields
      const activeMembership = existing.memberships?.find(m => m.status === "ACTIVE");
      const totalReceived = activeMembership?.amountPaid ?? existing.paymentSummary?.totalReceived ?? existing.received ?? 0;
      const totalPending = activeMembership?.pendingAmount ?? existing.paymentSummary?.totalPending ?? existing.pending ?? 0;
      const totalAmount = activeMembership?.totalAmount ?? existing.membershipAmount ?? existing.amount ?? 0;
      const months = activeMembership?.months ?? existing.membershipMonths;
      const startDate = activeMembership?.startDate ?? existing.startingDate;
      const expiryDate = activeMembership?.expiryDate ?? existing.expiryDate;

      const rupeesDiscount =
        existing.discountAmount != null && existing.discountAmount > 0
          ? existing.discountAmount
          : existing.discount && existing.discount > 0 && totalAmount
            ? Math.round(((totalAmount * existing.discount) / 100) * 100) / 100
            : 0;

      setForm({
        idNo:             existing.idNo ?? "",
        date:             existing.date ? existing.date.slice(0, 10) : "",
        name:             existing.name,
        contactNumber:    existing.contactNumber ?? existing.phone ?? "",
        dob:              existing.dob ? existing.dob.slice(0, 10) : "",
        anniversaryDate:  existing.anniversaryDate ? existing.anniversaryDate.slice(0, 10) : "",
        instagramHandle:  existing.instagramHandle ?? "",
        email:            existing.email ?? "",
        phone:            existing.phone ?? existing.contactNumber ?? "",
        membershipPlan:   existing.membershipPlan ?? "",
        membershipMonths: months ?? undefined,
        amount:           totalAmount,
        membershipAmount: totalAmount,
        received:         totalReceived,
        pending:          totalPending,
        mop:              existing.mop || "", // MOP not stored on user, only in payment records
        transactionId:    (existing as any).transactionId ?? "",
        salesPerson:      existing.salesPerson ?? "",
        trainingType:     existing.trainingType ?? "GT",
        trainer:          existing.trainer ?? "",
        memberType:       existing.memberType ?? "New",
        startingDate:     startDate ? startDate.slice(0, 10) : "",
        expiryDate:       expiryDate ? expiryDate.slice(0, 10) : "",
        memberStatus:     existing.memberStatus ?? "ACTIVE",
        address:          existing.address ?? "",
        emergencyContact: existing.emergencyContact ?? "",
        discountAmount:   rupeesDiscount,
        discountApprovedBy: existing.discountApprovedBy ?? "",
      });
      setHasDiscount(rupeesDiscount > 0);
    } else {
      setForm(EMPTY);
      setHasDiscount(false);
    }
    setError("");
  }, [existing, open]);

  // Auto-calculate pending amount whenever amount, received, or discount (₹) changes
  useEffect(() => {
    const totalAmount = form.amount ?? 0;
    const receivedAmount = form.received ?? 0;
    const rupeesOff = Math.min(form.discountAmount ?? 0, totalAmount);

    const amountAfterDiscount = totalAmount - rupeesOff;
    const calculatedPending = Math.max(0, amountAfterDiscount - receivedAmount);

    if (form.pending !== calculatedPending) {
      setForm(prev => ({
        ...prev,
        pending: calculatedPending,
      }));
    }
  }, [form.amount, form.received, form.discountAmount]);

  // FIX: added "membershipMonths" and "membershipAmount" to the numeric fields list
  // so they are cast to Number instead of being sent as strings to the API.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    let processedValue: string | number | undefined = value;

    // Process numeric fields
    if (["amount", "received", "pending", "membershipMonths", "membershipAmount", "discountAmount"].includes(name)) {
      processedValue = value === "" ? undefined : Number(value);

      // Validate received amount doesn't exceed total amount
      if (name === "received" && processedValue !== undefined) {
        const totalAmount = form.amount ?? 0;
        if (processedValue > totalAmount) {
          processedValue = totalAmount;
        }
        // Ensure received is not negative
        if (processedValue < 0) {
          processedValue = 0;
        }
      }
    }

    setForm(prev => {
      const next = { ...prev, [name]: processedValue } as CreateMemberPayload;
      if (name === "contactNumber" && typeof processedValue === "string") {
        next.phone = processedValue;
      }
      return next;
    });
  };

  const getRegisterPayload = (): RegisterMemberPayload => {
    const contactNumber = form.contactNumber || form.phone || "";
    const amount = form.amount ?? form.membershipAmount ?? 0;
    const received = form.received ?? 0;

    return {
      date: form.date || new Date().toISOString().split('T')[0],
      name: form.name,
      contactNumber,
      email: form.email || undefined,
      membershipMonths: form.membershipMonths ?? 1,
      amount,
      received,
      mop: form.mop || "cash",
      startingDate: form.startingDate || new Date().toISOString().split('T')[0],
      expiryDate: form.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dob: form.dob || undefined,
      instagramHandle: form.instagramHandle || undefined,
      salesPerson: form.salesPerson || undefined,
      trainingType: form.trainingType ?? "GT",
      trainer: form.trainer || undefined,
      memberType: form.memberType ?? "New",
      address: form.address || undefined,
      emergencyContact: form.emergencyContact || undefined,
      transactionId: form.transactionId || undefined,
      discountAmount:
        form.discountAmount && Number(form.discountAmount) > 0
          ? Number(form.discountAmount)
          : undefined,
      discountApprovedBy:
        form.discountAmount && Number(form.discountAmount) > 0 && form.discountApprovedBy
          ? form.discountApprovedBy
          : undefined,
    };
  };

  const getUpdatePayload = (): CreateMemberPayload => {
    const contactNumber = form.contactNumber || form.phone || "";

    const discountPatch = !hasDiscount
      ? { discountAmount: 0, discount: 0, discountApprovedBy: "" }
      : {
          discountAmount:
            form.discountAmount && Number(form.discountAmount) > 0
              ? Number(form.discountAmount)
              : undefined,
          discount:
            form.discountAmount && Number(form.discountAmount) > 0 ? 0 : undefined,
          discountApprovedBy:
            form.discountAmount && Number(form.discountAmount) > 0 && form.discountApprovedBy
              ? form.discountApprovedBy
              : undefined,
        };

    // For edit mode, only send editable fields (exclude membership and payment details)
    return {
      name: form.name,
      contactNumber,
      email: form.email || undefined,
      phone: contactNumber,
      dob: form.dob || undefined,
      anniversaryDate: form.anniversaryDate || undefined,
      instagramHandle: form.instagramHandle || undefined,
      address: form.address || undefined,
      emergencyContact: form.emergencyContact || undefined,
      salesPerson: form.salesPerson || undefined,
      trainer: form.trainer || undefined,
      trainingType: form.trainingType ?? "GT",
      memberType: form.memberType ?? "New",
      memberStatus: form.memberStatus || "ACTIVE",
      ...discountPatch,
    };
  };

  const handleSubmit = () => {
    // Basic validation (applies to both create and edit)
    if (!form.name || !(form.contactNumber || form.phone)) {
      setError("Name and phone number are required.");
      return;
    }

    // Membership/payment validation (only for create mode)
    if (!isEdit) {
      if (!form.membershipMonths || form.membershipMonths < 1) {
        setError("Membership months must be at least 1.");
        return;
      }
      if (form.amount === undefined || form.amount < 0) {
        setError("Amount must be 0 or greater.");
        return;
      }
      if (form.received === undefined || form.received < 0) {
        setError("Received amount must be 0 or greater.");
        return;
      }
      if (!form.mop) {
        setError("Mode of payment is required.");
        return;
      }
      if (!form.startingDate) {
        setError("Starting date is required.");
        return;
      }
      if (!form.expiryDate) {
        setError("Expiry date is required.");
        return;
      }
    }

    if (isEdit && existing) {
      const updatePayload = getUpdatePayload();
      updateMember(
        { id: existing._id, payload: updatePayload },
        {
          onSuccess: () => onClose(),
          onError: (err: any) => setError(err?.response?.data?.message ?? "Update failed."),
        }
      );
    } else {
      const registerPayload = getRegisterPayload();
      createMember(registerPayload, {
        onSuccess: () => onClose(),
        onError: (err: any) => setError(err?.response?.data?.message ?? "Create failed."),
      });
    }
  };

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>{isEdit ? "Edit Member" : "Add New Member"}</h2>
                <p className={styles.modalSubtitle}>{isEdit ? `Editing ${existing?.name}` : "Fill in the member details below."}</p>
              </div>
              <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <div className={styles.scrollBody}>
              {/* Section: Sales & Staff Info - MOVED TO TOP */}
              <div className={styles.sectionLabel}>Sales & Staff Assignment</div>
              <div className={styles.fields}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Sales Person *</label>
                    <select className={styles.input} name="salesPerson" value={form.salesPerson ?? ""} onChange={handleChange}>
                      <option value="">Select Sales Person</option>
                      {salesEmployees.map(emp => (
                        <option key={emp._id} value={emp.name}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Trainer</label>
                    <select className={styles.input} name="trainer" value={form.trainer ?? ""} onChange={handleChange}>
                      <option value="">Select Trainer</option>
                      {trainerEmployees.map(emp => (
                        <option key={emp._id} value={emp.name}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Personal Info */}
              <div className={styles.sectionLabel}>Personal Info</div>
              <div className={styles.fields}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>ID Number</label>
                    <input className={styles.input} name="idNo" placeholder="Auto-generated" value={form.idNo ?? ""} onChange={handleChange} disabled={isEdit} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Member Type</label>
                    <input className={styles.input} name="memberType" placeholder="e.g. New, Old, Renewal" value={form.memberType ?? ""} onChange={handleChange} />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Registration Date</label>
                    <input className={styles.input} name="date" type="date" value={form.date ?? ""} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Emergency Contact</label>
                    <input className={styles.input} name="emergencyContact" placeholder="Emergency phone" value={form.emergencyContact ?? ""} onChange={handleChange} />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Full Name *</label>
                    <input className={styles.input} name="name" placeholder="e.g. Daksh Sharma" value={form.name} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Phone number *</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select
                        className={styles.input}
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        style={{ width: "120px" }}
                      >
                        {COUNTRY_CODES.map(cc => (
                          <option key={cc.code} value={cc.code}>{cc.code} {cc.country}</option>
                        ))}
                      </select>
                      <input
                        className={styles.input}
                        name="contactNumber"
                        placeholder="9876543210"
                        value={form.contactNumber}
                        onChange={handleChange}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Email</label>
                    <input className={styles.input} name="email" type="email" placeholder="member@gym.com" value={form.email ?? ""} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Address</label>
                    <input className={styles.input} name="address" placeholder="123 Main St" value={form.address ?? ""} onChange={handleChange} />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Date of Birth</label>
                    <input className={styles.input} name="dob" type="date" value={form.dob ?? ""} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Anniversary Date</label>
                    <input className={styles.input} name="anniversaryDate" type="date" value={form.anniversaryDate ?? ""} onChange={handleChange} />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Instagram Handle</label>
                    <input className={styles.input} name="instagramHandle" placeholder="@handle" value={form.instagramHandle ?? ""} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    {/* Empty field for layout */}
                  </div>
                </div>
              </div>

              {/* Section: Membership & Payment */}
              <div className={styles.sectionLabel}>
                Membership & Payment
                {isEdit && existing?.paymentSummary && existing.paymentSummary.paymentCount > 1 && (
                  <span style={{
                    marginLeft: '12px',
                    fontSize: '11px',
                    color: '#6b7280',
                    fontWeight: 400,
                    backgroundColor: '#f3f4f6',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    Total from {existing.paymentSummary.paymentCount} payments
                  </span>
                )}
              </div>
              <div className={styles.fields}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Membership Plan *</label>
                    <select className={styles.input} value={form.membershipMonths ?? ""} onChange={handlePlanChange} disabled={isEdit}>
                      <option value="">Select Plan</option>
                      {MEMBERSHIP_PLANS.map(plan => (
                        <option key={plan.months} value={plan.months}>
                          {plan.label} - ₹{plan.price.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Duration (Months) *</label>
                    <input
                      className={styles.input}
                      name="membershipMonths"
                      type="number"
                      min="1"
                      placeholder="Enter number of months"
                      value={form.membershipMonths ?? ""}
                      onChange={handleChange}
                      disabled={isEdit}
                    />
                  </div>
                </div>

                <div className={styles.row}>
                  {!isEdit && (
                    <div className={styles.field}>
                      <label className={styles.label}>Mode of Payment</label>
                      <select className={styles.input} name="mop" value={form.mop ?? ""} onChange={handleChange}>
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="netbanking">Net Banking</option>
                      </select>
                    </div>
                  )}
                  <div className={styles.field}>
                    {/* Empty field for layout */}
                  </div>
                </div>

                {/* Discount Section */}
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="checkbox"
                        checked={hasDiscount}
                        onChange={(e) => {
                          setHasDiscount(e.target.checked);
                          if (!e.target.checked) {
                            setForm(prev => ({ ...prev, discountAmount: 0, discountApprovedBy: "" }));
                          }
                        }}
                      />
                      Apply Discount
                    </label>
                  </div>
                </div>

                {hasDiscount && (
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label className={styles.label}>Discount (₹)</label>
                      <input
                        className={styles.input}
                        name="discountAmount"
                        type="number"
                        placeholder="0"
                        min="0"
                        value={form.discountAmount ?? ""}
                        onChange={handleChange}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Approved By *</label>
                      <select className={styles.input} name="discountApprovedBy" value={form.discountApprovedBy ?? ""} onChange={handleChange}>
                        <option value="">Select Approver</option>
                        {APPROVERS.map(approver => (
                          <option key={approver} value={approver}>{approver}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className={styles.row3}>
                  <div className={styles.field}>
                    <label className={styles.label}>Total Amount (₹)</label>
                    <select
                      className={styles.input}
                      name="amount"
                      value={form.amount ?? ""}
                      onChange={handleChange}
                      disabled={isEdit || !form.membershipMonths}
                    >
                      <option value="">Select Amount</option>
                      {MEMBERSHIP_PLANS
                        .filter(plan => plan.months === form.membershipMonths)
                        .map(plan => (
                          <option key={plan.months} value={plan.price}>
                            ₹{plan.price.toLocaleString()}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Received (₹)</label>
                    <input
                      className={styles.input}
                      name="received"
                      type="number"
                      placeholder="0"
                      value={form.received ?? ""}
                      onChange={handleChange}
                      max={form.amount ?? 0}
                      min={0}
                      disabled={isEdit}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Pending (₹)</label>
                    <input
                      className={styles.input}
                      name="pending"
                      type="number"
                      placeholder="0"
                      value={form.pending ?? ""}
                      disabled
                      readOnly
                    />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Starting Date</label>
                    <input className={styles.input} name="startingDate" type="date" value={form.startingDate ?? ""} onChange={handleChange} disabled={isEdit} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Expiry Date</label>
                    <input className={styles.input} name="expiryDate" type="date" value={form.expiryDate ?? ""} onChange={handleChange} disabled={isEdit} />
                  </div>
                </div>
              </div>

              {/* Section: Training & Status */}
              <div className={styles.sectionLabel}>Training & Status</div>
              <div className={styles.fields}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Training Type</label>
                    <select className={styles.input} name="trainingType" value={form.trainingType ?? ""} onChange={handleChange}>
                      <option value="GT">GT (Group Training)</option>
                      <option value="PT">PT (Personal Training)</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Member Status</label>
                    <select className={styles.input} name="memberStatus" value={form.memberStatus ?? ""} onChange={handleChange}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSubmit} disabled={isPending}>
                {isPending
                  ? (isEdit ? "Saving…" : "Creating…")
                  : (isEdit ? "Save Changes" : "Add Member")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}