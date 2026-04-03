import { AppShell } from "../../components/shared/AppShell";
import { LuxuryMemberCard } from "../../components/resident/LuxuryMemberCard";
import { BenefitCard } from "../../components/resident/BenefitCard";
import { NewsCard } from "../../components/resident/NewsCard";
import { PromotionCard } from "../../components/resident/PromotionCard";
import { mockResidentProfile } from "../../lib/mock-data/resident";
import {
  mockBenefits,
  mockNews,
  mockPromotions,
} from "../../lib/mock-data/content";

export default function HomePage() {
  return (
    <AppShell title={`Good Evening, ${mockResidentProfile.displayName}`}>
      <div className="page-stack">
        <LuxuryMemberCard
          fullName={mockResidentProfile.fullName}
          memberId={mockResidentProfile.memberId}
          tier={mockResidentProfile.tier}
          pointBalance={mockResidentProfile.pointBalance}
        />

        <section className="section-stack">
          <h2>Featured Benefits</h2>
          {mockBenefits.slice(0, 2).map((item) => (
            <BenefitCard
              key={item.id}
              title={item.title}
              category={item.category}
              shortDescription={item.shortDescription}
            />
          ))}
        </section>

        <section className="section-stack">
          <h2>Latest News</h2>
          {mockNews.slice(0, 2).map((item) => (
            <NewsCard
              key={item.id}
              title={item.title}
              summary={item.summary}
              image={item.coverImage}
            />
          ))}
        </section>

        <section className="section-stack">
          <h2>Promotions</h2>
          {mockPromotions.slice(0, 1).map((item) => (
            <PromotionCard
              key={item.id}
              title={item.title}
              summary={item.summary}
              image={item.bannerImage}
            />
          ))}
        </section>
      </div>
    </AppShell>
  );
}
