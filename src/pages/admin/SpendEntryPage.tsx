import { useState } from "react";
import { AdminShell } from "../../components/admin/AdminShell";
import { SpendEntryForm } from "../../components/admin/SpendEntryForm";
import { mockOutlets, mockResidentsTable } from "../../lib/mock-data/admin";
import type { SpendEntryFormValues } from "../../lib/types/admin";
import type { ResidentProfile } from "../../lib/types/resident";

export default function SpendEntryPage() {
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<ResidentProfile | null>(
    mockResidentsTable[0]
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleSearchMember() {
    const normalized = search.trim().toLowerCase();
    const found = mockResidentsTable.find((item) => {
      return (
        item.fullName.toLowerCase().includes(normalized) ||
        item.memberId.toLowerCase().includes(normalized) ||
        item.residenceRef.toLowerCase().includes(normalized)
      );
    });

    setSelectedMember(found ?? null);
  }

  function handleSubmit(values: SpendEntryFormValues) {
    setSuccessMessage(
      `Saved transaction for ${values.memberId} · ${values.pointsPreview} pts added`
    );
  }

  return (
    <AdminShell title="Scan & Spend Entry">
      <div className="admin-page-stack">
        <section className="info-panel">
          <strong>Step 1 · Identify Resident</strong>
          <div className="toolbar toolbar--row">
            <input
              placeholder="Search by member ID / name / room"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="button" onClick={handleSearchMember}>
              Search Member
            </button>
            <button type="button" className="button-secondary">
              Scan QR
            </button>
          </div>
        </section>

        {successMessage ? (
          <div className="success-panel">{successMessage}</div>
        ) : null}

        <section className="info-panel">
          <strong>Step 2 · Enter Spend</strong>
          <p className="muted-text">
            Fill in outlet, bill number, and amount to calculate resident points.
          </p>
        </section>

        <SpendEntryForm
          selectedMember={selectedMember}
          outlets={mockOutlets}
          onSubmit={handleSubmit}
        />
      </div>
    </AdminShell>
  );
}
