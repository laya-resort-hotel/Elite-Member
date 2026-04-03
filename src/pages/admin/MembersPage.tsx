import { useEffect, useState } from 'react';
import { getMembers, updateResidentStatus } from '../../lib/services/adminService';
import type { MemberProfile } from '../../lib/types';

export default function MembersPage() {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');

  async function loadMembers() {
    try {
      setMembers(await getMembers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load members.');
    }
  }

  useEffect(() => {
    void loadMembers();
  }, []);

  async function toggleStatus(member: MemberProfile) {
    try {
      setSavingId(member.id);
      await updateResidentStatus(member.id, member.status === 'active' ? 'inactive' : 'active');
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update member.');
    } finally {
      setSavingId('');
    }
  }

  if (error) return <div className="status-card error-text">{error}</div>;
  if (!members.length) return <div className="status-card">Loading members…</div>;

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="section-head">
          <h3>Member Management</h3>
          <span className="muted">Resident profiles from Firestore</span>
        </div>
        <div className="stack-sm">
          {members.map((member) => (
            <article key={member.id} className="row-card wrap-row-card">
              <div>
                <strong>{member.fullName}</strong>
                <div className="muted">{member.roomLabel}</div>
                <div className="muted">{member.email}</div>
                <div className="muted">{member.memberId}</div>
              </div>
              <div className="right-text">
                <span className={`pill small ${member.status === 'active' ? '' : 'muted-pill'}`}>
                  {member.status}
                </span>
                <button className="secondary-button" type="button" onClick={() => void toggleStatus(member)} disabled={savingId === member.id}>
                  {savingId === member.id ? 'Saving…' : member.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
