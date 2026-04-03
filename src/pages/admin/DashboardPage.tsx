import { mockDashboardStats, mockNews } from '../../lib/mockData';

export default function DashboardPage() {
  return (
    <div className="stack-lg">
      <section className="admin-stat-grid">
        {mockDashboardStats.map((stat) => (
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
          {mockNews.slice(0, 2).map((item) => (
            <article key={item.id} className="row-card">
              <div>
                <strong>{item.title}</strong>
                <div className="muted">{item.category}</div>
              </div>
              <button className="secondary-button" type="button">
                Edit
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
