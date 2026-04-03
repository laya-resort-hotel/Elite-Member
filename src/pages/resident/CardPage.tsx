import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getResidentProfile, profileToCard } from '../../lib/services/residentService';
import type { MemberCard } from '../../lib/types';

export default function CardPage() {
  const { user } = useAuth();
  const [card, setCard] = useState<MemberCard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    getResidentProfile(user)
      .then((profile) => setCard(profileToCard(profile)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load member card.'));
  }, [user]);

  if (error) return <div className="status-card error-text">{error}</div>;
  if (!card) return <div className="status-card">Loading member card…</div>;

  return (
    <div className="stack-lg">
      <section className="black-card large">
        <div className="card-chip" />
        <div className="card-brand">ELITE BLACK CARD</div>
        <div className="card-name">{card.fullName}</div>
        <div className="card-meta">{card.roomLabel}</div>
        <div className="card-meta">{card.memberId}</div>
        <div className="card-footer">{card.since}</div>
      </section>

      <section className="panel centered-panel">
        <div className="qr-box">
          <div className="qr-pattern" />
        </div>
        <h3>{card.memberId}</h3>
        <p className="muted centered-text">
          Staff can scan this member code to identify the resident and record spending for point accrual.
        </p>
        <div className="inline-actions">
          <button className="primary-button" type="button" onClick={() => window.alert(card.qrPayload)}>
            Show QR Payload
          </button>
          <button className="secondary-button" type="button" onClick={() => window.print()}>
            Save / Print Card
          </button>
        </div>
      </section>
    </div>
  );
}
