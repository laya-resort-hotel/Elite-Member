import { AppShell } from "../../components/shared/AppShell";
import { mockResidentProfile } from "../../lib/mock-data/resident";

export default function QRPage() {
  return (
    <AppShell title="Member QR" showBottomNav={false} showBackButton>
      <div className="qr-page">
        <div className="qr-box">QR PLACEHOLDER</div>
        <h2>{mockResidentProfile.fullName}</h2>
        <p>{mockResidentProfile.memberId}</p>
        <p>Present this code to hotel staff</p>
      </div>
    </AppShell>
  );
}
