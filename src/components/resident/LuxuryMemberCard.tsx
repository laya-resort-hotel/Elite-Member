type LuxuryMemberCardProps = {
  fullName: string;
  memberId: string;
  tier: string;
  pointBalance: number;
};

export function LuxuryMemberCard({
  fullName,
  memberId,
  tier,
  pointBalance,
}: LuxuryMemberCardProps) {
  return (
    <section className="luxury-card">
      <div className="luxury-card__brand">LAYA Resident</div>
      <div className="luxury-card__tier">{tier}</div>

      <div className="luxury-card__body">
        <h2 className="luxury-card__name">{fullName}</h2>
        <p className="luxury-card__id">{memberId}</p>
      </div>

      <div className="luxury-card__footer">
        <span>Points</span>
        <strong>{pointBalance.toLocaleString()}</strong>
      </div>
    </section>
  );
}
