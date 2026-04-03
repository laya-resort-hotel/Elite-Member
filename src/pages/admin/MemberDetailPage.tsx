import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminShell } from "../../components/admin/AdminShell";
import {
  mockMemberNotes,
  mockMemberTransactions,
  mockPointAdjustments,
  mockResidentsTable,
} from "../../lib/mock-data/admin";
import { ADMIN_ROUTES } from "../../lib/constants/routes";

export default function MemberDetailPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();

  const member = useMemo(
    () => mockResidentsTable.find((item) => item.memberId === memberId),
    [memberId]
  );

  const memberTransactions = mockMemberTransactions.filter(
    (item) => item.memberId === memberId
  );

  const memberAdjustments = mockPointAdjustments.filter(
    (item) => item.memberId === memberId
  );

  const memberNotes = mockMemberNotes.filter((item) => item.memberId === memberId);

  if (!member) {
    return (
      <AdminShell title="Resident Detail">
        <div className="empty-state-card">
          <h2>Resident not found</h2>
          <p className="muted-text">
            The requested member record could not be found.
          </p>
          <button onClick={() => navigate(ADMIN_ROUTES.MEMBERS)}>
            Back to Members
          </button>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Resident Detail">
      <div className="admin-page-stack">
        <section className="member-detail-hero">
          <div>
            <p className="muted-text">Elite Black Card Member</p>
            <h2>{member.fullName}</h2>
            <p className="muted-text">
              {member.memberId} · {member.residenceRef}
            </p>
          </div>

          <div className="member-detail-hero__stats">
            <div className="member-detail-stat">
              <span>Status</span>
              <strong>{member.status}</strong>
            </div>
            <div className="member-detail-stat">
              <span>Point Balance</span>
              <strong>{member.pointBalance.toLocaleString()} pts</strong>
            </div>
            <div className="member-detail-stat">
              <span>Member Since</span>
              <strong>{member.memberSince}</strong>
            </div>
          </div>
        </section>

        <div className="button-row">
          <button onClick={() => navigate(ADMIN_ROUTES.SPEND_ENTRY)}>
            Add Spend
          </button>
          <button type="button" className="button-secondary">
            Point Adjustment
          </button>
          <button type="button" className="button-secondary">
            Edit Profile
          </button>
        </div>

        <section className="detail-grid">
          <article className="info-panel">
            <strong>Profile Information</strong>
            <div className="detail-list">
              <div>
                <span>Full Name</span>
                <strong>{member.fullName}</strong>
              </div>
              <div>
                <span>Display Name</span>
                <strong>{member.displayName}</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>{member.phone ?? "-"}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{member.email ?? "-"}</strong>
              </div>
              <div>
                <span>QR Token</span>
                <strong>{member.qrToken}</strong>
              </div>
            </div>
          </article>

          <article className="info-panel">
            <strong>Point Summary</strong>
            <div className="detail-list">
              <div>
                <span>Total Earned</span>
                <strong>{member.totalEarned.toLocaleString()}</strong>
              </div>
              <div>
                <span>Total Used</span>
                <strong>{member.totalUsed.toLocaleString()}</strong>
              </div>
              <div>
                <span>Current Balance</span>
                <strong>{member.pointBalance.toLocaleString()}</strong>
              </div>
            </div>
          </article>
        </section>

        <section className="section-stack">
          <h2>Recent Transactions</h2>
          {memberTransactions.map((item) => (
            <article key={item.id} className="history-card">
              <div className="history-card__top">
                <strong>{item.outletName}</strong>
                <span>+{item.pointsEarned} pts</span>
              </div>
              <div className="history-card__bottom">
                <span>{item.date}</span>
                <span>{item.billNumber ?? item.status}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="detail-grid">
          <article className="info-panel">
            <strong>Point Adjustments</strong>
            <div className="stack-sm">
              {memberAdjustments.map((item) => (
                <div key={item.id} className="soft-row">
                  <div>
                    <strong>
                      {item.type === "add" ? "+" : "-"}
                      {item.points} pts
                    </strong>
                    <p className="muted-text">{item.reason}</p>
                  </div>
                  <span className="muted-text">{item.updatedAt}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="info-panel">
            <strong>Internal Notes</strong>
            <div className="stack-sm">
              {memberNotes.map((item) => (
                <div key={item.id} className="soft-row">
                  <div>
                    <p>{item.text}</p>
                    <span className="muted-text">{item.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </AdminShell>
  );
}
