import { mockMemberCard } from '../../lib/mockData';

export default function CardPage() {
  return (
    <div className="stack-lg">
      <section className="black-card large">
        <div className="card-chip" />
        <div className="card-brand">ELITE BLACK CARD</div>
        <div className="card-name">{mockMemberCard.fullName}</div>
        <div className="card-meta">{mockMemberCard.roomLabel}</div>
        <div className="card-meta">{mockMemberCard.memberId}</div>
        <div className="card-footer">{mockMemberCard.since}</div>
      </section>

      <section className="panel centered-panel">
        <div className="qr-box">
          <div className="qr-pattern" />
        </div>
        <h3>{mockMemberCard.memberId}</h3>
        <p className="muted centered-text">
          Staff can scan this member code to identify the resident and record spending for point accrual.
        </p>
        <div className="inline-actions">
          <button className="primary-button" type="button">
            Full Screen QR
          </button>
          <button className="secondary-button" type="button">
            Save Card
          </button>
        </div>
      </section>
    </div>
  );
}
