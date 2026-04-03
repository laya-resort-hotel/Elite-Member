import { useNavigate } from "react-router-dom";
import { AppShell } from "../../components/shared/AppShell";
import { LuxuryMemberCard } from "../../components/resident/LuxuryMemberCard";
import { mockResidentProfile } from "../../lib/mock-data/resident";
import { RESIDENT_ROUTES } from "../../lib/constants/routes";

export default function CardPage() {
  const navigate = useNavigate();

  return (
    <AppShell title="Elite Black Card">
      <div className="page-stack">
        <LuxuryMemberCard
          fullName={mockResidentProfile.fullName}
          memberId={mockResidentProfile.memberId}
          tier={mockResidentProfile.tier}
          pointBalance={mockResidentProfile.pointBalance}
        />

        <div className="info-panel">
          <div><strong>Status:</strong> {mockResidentProfile.status}</div>
          <div><strong>Residence Ref:</strong> {mockResidentProfile.residenceRef}</div>
          <div><strong>Member Since:</strong> {mockResidentProfile.memberSince}</div>
        </div>

        <button onClick={() => navigate(RESIDENT_ROUTES.QR)}>Show QR Code</button>
      </div>
    </AppShell>
  );
}
