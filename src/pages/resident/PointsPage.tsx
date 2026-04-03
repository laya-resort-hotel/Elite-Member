import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getResidentProfile, getResidentTransactions, profileToSummary } from '../../lib/services/residentService';
import type { PointSummary, PointTransaction } from '../../lib/types';

export default function PointsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<PointSummary | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const profile = await getResidentProfile(user);
        setSummary(profileToSummary(profile));
        setTransactions(await getResidentTransactions(profile));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load point data.');
      }
    })();
  }, [user]);

  if (error) return <div className="status-card error-text">{error}</div>;
  if (!summary) return <div className="status-card">Loading point summary…</div>;

  return (
    <div className="stack-lg">
      <section className="panel accent-panel">
        <div className="summary-number">{summary.balance.toLocaleString()}</div>
        <div className="muted centered-text">Current total points</div>
        <div className="summary-grid compact">
          <article className="summary-tile">
            <span className="muted">Earned This Month</span>
            <strong>{summary.thisMonthEarned.toLocaleString()}</strong>
          </article>
          <article className="summary-tile">
            <span className="muted">Expiring Soon</span>
            <strong>{summary.expiringSoon.toLocaleString()}</strong>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <h3>Point History</h3>
          <span className="muted">Latest transactions</span>
        </div>
        <div className="stack-sm">
          {transactions.map((tx) => (
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
