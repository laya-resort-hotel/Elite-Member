import { useEffect, useState } from 'react';
import { getAdminDashboardStats, getRecentTransactions } from '../../lib/services/adminService';
import { getEditableNews } from '../../lib/services/contentService';
import type { DashboardStat, NewsItem, PointTransaction } from '../../lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getAdminDashboardStats(), getEditableNews(), getRecentTransactions()])
      .then(([statsData, newsData, txData]) => {
        setStats(statsData);
        setNews(newsData);
        setTransactions(txData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load admin dashboard.'));
  }, []);

  if (error) return <div className="status-card error-text">{error}</div>;
  if (!stats.length) return <div className="status-card">Loading admin dashboard…</div>;

  return (
    <div className="stack-lg">
      <section className="admin-stat-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="admin-stat-card">
            <span className="muted">{stat.label}</span>
            <strong>{stat.value}</strong>
            <p>{stat.hint}</p>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="section-head">
          <h3>Latest Content</h3>
          <span className="muted">Recently updated items</span>
        </div>
        <div className="stack-sm">
          {news.slice(0, 3).map((item) => (
            <article key={item.id} className="row-card">
              <div>
                <strong>{item.title}</strong>
                <div className="muted">{item.category}</div>
              </div>
              <span className="pill small">{item.isPublished ? 'published' : 'draft'}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <h3>Recent Spend Entries</h3>
          <span className="muted">Latest point transactions</span>
        </div>
        <div className="stack-sm">
          {transactions.length ? transactions.map((tx) => (
            <article key={tx.id} className="row-card">
              <div>
                <strong>{tx.outlet}</strong>
                <div className="muted">{tx.date}</div>
              </div>
              <div className="right-text">
                <strong>+{tx.points}</strong>
                <div className="muted">฿{tx.spendAmount.toLocaleString()}</div>
              </div>
            </article>
          )) : <div className="muted">No transactions yet.</div>}
        </div>
      </section>
    </div>
  );
}
