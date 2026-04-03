import { AppShell } from "../../components/shared/AppShell";
import { BenefitCard } from "../../components/resident/BenefitCard";
import { mockBenefits } from "../../lib/mock-data/content";

export default function BenefitsPage() {
  return (
    <AppShell title="Benefits">
      <div className="page-stack">
        {mockBenefits.map((item) => (
          <BenefitCard
            key={item.id}
            title={item.title}
            category={item.category}
            shortDescription={item.shortDescription}
          />
        ))}
      </div>
    </AppShell>
  );
}
