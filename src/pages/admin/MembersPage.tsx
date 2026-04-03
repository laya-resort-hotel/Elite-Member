import { mockMembers } from '../../lib/mockData';

export default function MembersPage() {
  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="section-head">
          <h3>Member Management</h3>
          <button className="primary-button" type="button">
            Add Member
          </button>
        </div>
        <div className="stack-sm">
          {mockMembers.map((member) => (
            <article key={member.id} className="row-card">
              <div>
                <strong>{member.fullName}</strong>
                <div className="muted">{member.roomLabel}</div>
                <div className="muted">{member.email}</div>
              </div>
              <div className="right-text">
                <span className={`pill small ${member.status === 'active' ? '' : 'muted-pill'}`}>
                  {member.status}
                </span>
                <button className="secondary-button" type="button">
                  View
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
