import { useMemo, useState } from "react";
import type { SpendEntryFormValues } from "../../lib/types/admin";
import type { ResidentProfile } from "../../lib/types/resident";

type OutletOption = {
  id: string;
  label: string;
};

type SpendEntryFormProps = {
  selectedMember: ResidentProfile | null;
  outlets: OutletOption[];
  onSubmit?: (values: SpendEntryFormValues) => void;
};

export function SpendEntryForm({
  selectedMember,
  outlets,
  onSubmit,
}: SpendEntryFormProps) {
  const [form, setForm] = useState<SpendEntryFormValues>({
    memberId: selectedMember?.memberId ?? "",
    outletId: "",
    billNumber: "",
    amount: "",
    pointRate: 25,
    pointsPreview: 0,
    note: "",
  });

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const pointsPreview = useMemo(() => {
    if (form.amount === "" || Number(form.amount) <= 0) return 0;
    return Math.floor(Number(form.amount) / form.pointRate);
  }, [form.amount, form.pointRate]);

  function updateField<K extends keyof SpendEntryFormValues>(
    key: K,
    value: SpendEntryFormValues[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      pointsPreview:
        key === "amount" || key === "pointRate"
          ? Math.floor(
              Number(key === "amount" ? value : prev.amount || 0) /
                Number(key === "pointRate" ? value : prev.pointRate || 25)
            )
          : prev.pointsPreview,
    }));
  }

  function handleBillBlur() {
    const duplicatedExamples = ["AR-240401-101", "TT-240328-052"];
    if (duplicatedExamples.includes(form.billNumber.trim())) {
      setDuplicateWarning(
        "This bill number may already exist in the system. Please verify before saving."
      );
      return;
    }
    setDuplicateWarning(null);
  }

  function resetForm() {
    setForm({
      memberId: selectedMember?.memberId ?? "",
      outletId: "",
      billNumber: "",
      amount: "",
      pointRate: 25,
      pointsPreview: 0,
      note: "",
    });
    setDuplicateWarning(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedMember) return;
    if (!form.outletId || !form.billNumber || form.amount === "") return;

    const payload: SpendEntryFormValues = {
      ...form,
      memberId: selectedMember.memberId,
      pointsPreview,
    };

    onSubmit?.(payload);
    resetForm();
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <section className="info-panel">
        <strong>Selected Member</strong>
        {selectedMember ? (
          <div className="selected-member-card">
            <div>
              <div className="selected-member-card__name">
                {selectedMember.fullName}
              </div>
              <div className="muted-text">{selectedMember.memberId}</div>
            </div>
            <div className="selected-member-card__meta">
              <span>{selectedMember.tier}</span>
              <span>{selectedMember.pointBalance.toLocaleString()} pts</span>
            </div>
          </div>
        ) : (
          <p className="muted-text">
            No resident selected. Search member or scan QR first.
          </p>
        )}
      </section>

      <label className="field-stack">
        <span>Outlet</span>
        <select
          value={form.outletId}
          onChange={(e) => updateField("outletId", e.target.value)}
          disabled={!selectedMember}
        >
          <option value="">Select outlet</option>
          {outlets.map((outlet) => (
            <option key={outlet.id} value={outlet.id}>
              {outlet.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field-stack">
        <span>Bill Number</span>
        <input
          placeholder="Enter bill number"
          value={form.billNumber}
          onChange={(e) => updateField("billNumber", e.target.value)}
          onBlur={handleBillBlur}
          disabled={!selectedMember}
        />
      </label>

      {duplicateWarning ? (
        <div className="warning-panel">{duplicateWarning}</div>
      ) : null}

      <label className="field-stack">
        <span>Amount</span>
        <input
          type="number"
          placeholder="Enter amount"
          value={form.amount}
          onChange={(e) =>
            updateField(
              "amount",
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
          disabled={!selectedMember}
        />
      </label>

      <label className="field-stack">
        <span>Point Rate</span>
        <input
          type="number"
          value={form.pointRate}
          onChange={(e) => updateField("pointRate", Number(e.target.value))}
          disabled={!selectedMember}
        />
      </label>

      <section className="info-panel">
        <strong>Point Preview</strong>
        <div className="point-preview-value">{pointsPreview} pts</div>
        <p className="muted-text">
          Current rule: every {form.pointRate} THB = 1 point
        </p>
      </section>

      <label className="field-stack">
        <span>Note</span>
        <textarea
          rows={4}
          placeholder="Optional internal note"
          value={form.note}
          onChange={(e) => updateField("note", e.target.value)}
          disabled={!selectedMember}
        />
      </label>

      <div className="button-row">
        <button type="submit" disabled={!selectedMember}>
          Save Transaction
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={resetForm}
        >
          Reset
        </button>
      </div>
    </form>
  );
}
