import { AppShell } from "../../components/shared/AppShell";
import { mockNews } from "../../lib/mock-data/content";

export default function NewsListPage() {
  return (
    <AppShell title="News" showBackButton>
      <div className="page-stack">
        {mockNews.map((item) => (
          <article key={item.id} className="content-card">
            <img
              src={item.coverImage}
              alt={item.title}
              className="content-card__image"
            />

            <div className="content-card__body">
              <div className="content-card__meta">
                <span>{item.publishDate}</span>
                <span>{item.status}</span>
              </div>

              <h3>{item.title}</h3>
              {item.subtitle ? (
                <p className="content-card__subtitle">{item.subtitle}</p>
              ) : null}
              <p>{item.summary}</p>
              <span className="inline-link">Read More</span>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
