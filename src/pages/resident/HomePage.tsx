import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getResidentDashboard } from '../../lib/services/residentService';
import type { Benefit, MemberCard, MemberProfile, NewsItem, PointSummary, PointTransaction } from '../../lib/types';

interface DashboardData {
  card: MemberCard;
  summary: PointSummary;
  transactions: PointTransaction[];
  benefits: Benefit[];
  news: NewsItem[];
  profile: MemberProfile;
}

export default function HomePage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    getResidentDashboard(user)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load dashboard.'));
  }, [user]);

  if (error) return <div className="status-card error-text">{error}</div>;
  if (!data) return <div className="status-card">Loading resident dashboard…</div>;

  return (
    <div className="stack-lg">
      <section className="hero-card">
        <div className="hero-copy">
          <div className="eyebrow gold">LAYA Resident</div>
          <h2>Elite Black Card</h2>
          <p>
            A private member experience for residents, designed to make every stay, dining moment, and hotel privilege feel personal.
          </p>
        </div>
        <div className="black-card">
          <div className="card-chip" />
          <div className="card-brand">ELITE BLACK CARD</div>
          <div className="card-name">{data.card.fullName}</div>
          <div className="card-meta">{data.card.memberId}</div>
        </div>
      </section>

      <section className="summary-grid">
        <article className="summary-tile">
          <span className="muted">Available Points</span>
          <strong>{data.summary.balance.toLocaleString()}</strong>
        </article>
        <article className="summary-tile">
          <span className="muted">This Month</span>
          <strong>+{data.summary.thisMonthEarned.toLocaleString()}</strong>
        </article>
        <article className="summary-tile">
          <span className="muted">Expiring Soon</span>
          <strong>{data.summary.expiringSoon.toLocaleString()}</strong>
        </article>
      </section>

      <section className="quick-actions">
        <Link className="primary-button" to="/card">
          Show Member QR
        </Link>
        <Link className="secondary-button" to="/benefits">
          View Benefits
        </Link>
      </section>

      <section className="panel">
        <div className="section-head">
          <h3>Featured Benefits</h3>
          <Link to="/benefits">See all</Link>
        </div>
        <div className="stack-md">
          {data.benefits.slice(0, 2).map((benefit) => (
            <article key={benefit.id} className="list-card">
              <span className="pill">{benefit.tag}</span>
              <h4>{benefit.title}</h4>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <h3>Recent Activity</h3>
          <Link to="/points">More</Link>
        </div>
        <div className="stack-sm">
          {data.transactions.slice(0, 2).map((tx) => (
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
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <h3>News & Promotions</h3>
          <Link to="/news">Open</Link>
        </div>
        <div className="news-scroll">
          {data.news.map((item) => (
            <article key={item.id} className="news-card">
              <span className="pill alt">{item.category}</span>
              <h4>{item.title}</h4>
              <p>{item.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
