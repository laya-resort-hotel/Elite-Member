import { useEffect, useState } from 'react';
import { getBenefits } from '../../lib/services/residentService';
import type { Benefit } from '../../lib/types';

export default function BenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getBenefits().then(setBenefits).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load benefits.'));
  }, []);

  if (error) return <div className="status-card error-text">{error}</div>;
  if (!benefits.length) return <div className="status-card">Loading benefits…</div>;

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="section-head">
          <h3>Resident Privileges</h3>
          <span className="muted">Premium benefits curated for owner members</span>
        </div>
        <div className="stack-md">
          {benefits.map((benefit) => (
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
