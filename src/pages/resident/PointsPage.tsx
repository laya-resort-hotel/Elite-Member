import { mockPointSummary, mockTransactions } from '../../lib/mockData';

export default function PointsPage() {
  return (
    <div className="stack-lg">
      <section className="panel accent-panel">
        <div className="summary-number">{mockPointSummary.balance.toLocaleString()}</div>
        <div className="muted centered-text">Current total points</div>
        <div className="summary-grid compact">
          <article className="summary-tile">
            <span className="muted">Earned This Month</span>
            <strong>{mockPointSummary.thisMonthEarned.toLocaleString()}</strong>
          </article>
          <article className="summary-tile">
            <span className="muted">Expiring Soon</span>
            <strong>{mockPointSummary.expiringSoon.toLocaleString()}</strong>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <h3>Point History</h3>
          <span className="muted">Latest transactions</span>
        </div>
        <div className="stack-sm">
          {mockTransactions.map((tx) => (
            <article key={tx.id} className="row-card">
              <div>
                <strong>{tx.outlet}</strong>
                <div className="muted">{tx.date}</div>
                <div className="muted">Spend ฿{tx.spendAmount.toLocaleString()}</div>
              </div>
              <div className="right-text">
                <strong>+{tx.points}</strong>
                <span className="pill small">{tx.status}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
