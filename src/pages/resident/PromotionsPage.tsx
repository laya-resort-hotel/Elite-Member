import { AppShell } from "../../components/shared/AppShell";
import { mockPromotions } from "../../lib/mock-data/content";

export default function PromotionsPage() {
  return (
    <AppShell title="Promotions" showBackButton>
      <div className="page-stack">
        {mockPromotions.map((item) => (
          <article key={item.id} className="content-card">
            <img
              src={item.bannerImage}
              alt={item.title}
              className="content-card__image"
            />

            <div className="content-card__body">
              <div className="content-card__meta">
                <span>{item.outlet}</span>
                <span>
                  {item.startDate} - {item.endDate}
                </span>
              </div>

              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <span className="inline-link">View Details</span>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
