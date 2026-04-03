import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getResidentProfile } from '../../lib/services/residentService';
import type { MemberProfile } from '../../lib/types';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    getResidentProfile(user).then(setProfile).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load profile.'));
  }, [user]);

  if (error) return <div className="status-card error-text">{error}</div>;
  if (!profile) return <div className="status-card">Loading resident profile…</div>;

  return (
    <div className="stack-lg">
      <section className="panel">
        <h3>Resident Profile</h3>
        <div className="detail-list">
          <div className="detail-row">
            <span>Name</span>
            <strong>{profile.fullName}</strong>
          </div>
          <div className="detail-row">
            <span>Member ID</span>
            <strong>{profile.memberId}</strong>
          </div>
          <div className="detail-row">
            <span>Residence</span>
            <strong>{profile.roomLabel}</strong>
          </div>
          <div className="detail-row">
            <span>Email</span>
            <strong>{profile.email || '-'}</strong>
          </div>
          <div className="detail-row">
            <span>Phone</span>
            <strong>{profile.phone || '-'}</strong>
          </div>
          <div className="detail-row">
            <span>Status</span>
            <strong>{profile.status}</strong>
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
