import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminShell } from "../../components/admin/AdminShell";
import { mockResidentsTable } from "../../lib/mock-data/admin";

export default function MembersPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");

  const filteredResidents = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return mockResidentsTable;

    return mockResidentsTable.filter((item) => {
      return (
        item.fullName.toLowerCase().includes(normalized) ||
        item.memberId.toLowerCase().includes(normalized) ||
        item.residenceRef.toLowerCase().includes(normalized) ||
        (item.phone ?? "").toLowerCase().includes(normalized)
      );
    });
  }, [keyword]);

  return (
    <AdminShell title="Resident Search">
      <div className="admin-page-stack">
        <div className="toolbar toolbar--row">
          <input
            placeholder="Search by name / member ID / phone / room"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button type="button">Search</button>
        </div>

        <section className="section-stack">
          {filteredResidents.map((item) => (
            <article key={item.memberId} className="member-row-card">
              <div className="member-row-card__main">
                <strong>{item.fullName}</strong>
                <p className="muted-text">
                  {item.memberId} · {item.residenceRef}
                </p>
              </div>

              <div className="member-row-card__side">
                <span className="status-chip">{item.status}</span>
                <strong>{item.pointBalance.toLocaleString()} pts</strong>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => navigate(`/admin/members/${item.memberId}`)}
                >
                  View Detail
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </AdminShell>
  );
}
