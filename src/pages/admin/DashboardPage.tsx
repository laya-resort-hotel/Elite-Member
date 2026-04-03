import { AdminShell } from "../../components/admin/AdminShell";
import {
  mockDashboardStats,
  mockRecentTransactions,
} from "../../lib/mock-data/admin";

export default function DashboardPage() {
  return (
    <AdminShell title="Dashboard">
      <div className="admin-page-stack">
        <section className="admin-stat-grid">
          <div className="admin-stat-card">
            <span>Transactions Today</span>
            <h3>{mockDashboardStats.transactionsToday}</h3>
          </div>
          <div className="admin-stat-card">
            <span>Points Today</span>
            <h3>{mockDashboardStats.pointsToday}</h3>
          </div>
          <div className="admin-stat-card">
            <span>Active Residents</span>
            <h3>{mockDashboardStats.activeResidents}</h3>
          </div>
          <div className="admin-stat-card">
            <span>Pending Drafts</span>
            <h3>{mockDashboardStats.pendingDrafts}</h3>
          </div>
        </section>

        <section className="section-stack">
          <h2>Recent Transactions</h2>
          {mockRecentTransactions.map((item) => (
            <article key={item.id} className="history-card">
              <div className="history-card__top">
                <strong>{item.memberName}</strong>
                <span>{item.points} pts</span>
              </div>
              <div className="history-card__bottom">
                <span>{item.outletName}</span>
                <span>{item.time}</span>
              </div>
            </article>
          ))}
        </section>
      </div>
    </AdminShell>
  );
}
