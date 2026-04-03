import { AppShell } from "../../components/shared/AppShell";
import { mockResidentProfile } from "../../lib/mock-data/resident";

export default function ProfilePage() {
  return (
    <AppShell title="Profile" showBackButton>
      <div className="page-stack">
        <section className="profile-hero-card">
          <div className="profile-avatar">MW</div>
          <div>
            <h2>{mockResidentProfile.fullName}</h2>
            <p className="muted-text">{mockResidentProfile.memberId}</p>
          </div>
        </section>

        <section className="info-panel">
          <strong>Member Information</strong>
          <div className="detail-list">
            <div>
              <span>Tier</span>
              <strong>{mockResidentProfile.tier}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{mockResidentProfile.status}</strong>
            </div>
            <div>
              <span>Residence Ref</span>
              <strong>{mockResidentProfile.residenceRef}</strong>
            </div>
            <div>
              <span>Member Since</span>
              <strong>{mockResidentProfile.memberSince}</strong>
            </div>
          </div>
        </section>

        <section className="info-panel">
          <strong>Contact Information</strong>
          <div className="detail-list">
            <div>
              <span>Phone</span>
              <strong>{mockResidentProfile.phone}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{mockResidentProfile.email}</strong>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
