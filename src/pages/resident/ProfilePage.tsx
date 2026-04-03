import { mockMemberCard } from '../../lib/mockData';

export default function ProfilePage() {
  return (
    <div className="stack-lg">
      <section className="panel">
        <h3>Resident Profile</h3>
        <div className="detail-list">
          <div className="detail-row">
            <span>Name</span>
            <strong>{mockMemberCard.fullName}</strong>
          </div>
          <div className="detail-row">
            <span>Member ID</span>
            <strong>{mockMemberCard.memberId}</strong>
          </div>
          <div className="detail-row">
            <span>Residence</span>
            <strong>{mockMemberCard.roomLabel}</strong>
          </div>
          <div className="detail-row">
            <span>Status</span>
            <strong>Active</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>Preferences</h3>
        <div className="stack-sm">
          <button className="secondary-button" type="button">
            Language Settings
          </button>
          <button className="secondary-button" type="button">
            Contact Concierge
          </button>
          <button className="secondary-button" type="button">
            Privacy & Terms
          </button>
        </div>
      </section>
    </div>
  );
}
