import { AppShell } from "../../components/shared/AppShell";
import {
  mockPointTransactions,
  mockResidentProfile,
} from "../../lib/mock-data/resident";

export default function PointsPage() {
  return (
    <AppShell title="Points">
      <div className="page-stack">
        <section className="points-hero">
          <div>
            <span>Current Balance</span>
            <h2>{mockResidentProfile.pointBalance.toLocaleString()}</h2>
          </div>
          <div className="points-hero__meta">
            <div>Total Earned: {mockResidentProfile.totalEarned.toLocaleString()}</div>
            <div>Total Used: {mockResidentProfile.totalUsed.toLocaleString()}</div>
          </div>
        </section>

        <section className="section-stack">
          <h2>Point History</h2>
          {mockPointTransactions.map((item) => (
            <article key={item.id} className="history-card">
              <div className="history-card__top">
                <strong>{item.outletName}</strong>
                <span>+{item.pointsEarned}</span>
              </div>
              <div className="history-card__bottom">
                <span>{item.date}</span>
                <span>{item.status}</span>
              </div>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
