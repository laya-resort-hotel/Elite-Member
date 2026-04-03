import { mockBenefits } from '../../lib/mockData';

export default function BenefitsPage() {
  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="section-head">
          <h3>Resident Privileges</h3>
          <span className="muted">Premium benefits curated for owner members</span>
        </div>
        <div className="stack-md">
          {mockBenefits.map((benefit) => (
            <article key={benefit.id} className="list-card">
              <span className="pill">{benefit.tag}</span>
              <h4>{benefit.title}</h4>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
