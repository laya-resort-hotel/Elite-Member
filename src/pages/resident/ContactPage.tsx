import { AppShell } from "../../components/shared/AppShell";

export default function ContactPage() {
  return (
    <AppShell title="Contact" showBackButton>
      <div className="page-stack">
        <section className="info-panel">
          <strong>Resident Services</strong>
          <div className="stack-sm">
            <p><strong>Phone:</strong> +66 XX XXX XXXX</p>
            <p><strong>Email:</strong> resident@layaresort.com</p>
            <p><strong>Hours:</strong> 08:00 - 20:00</p>
          </div>
        </section>

        <section className="info-panel">
          <strong>LAYA Resort Hotel</strong>
          <div className="stack-sm">
            <p>123 Example Road, Phuket, Thailand</p>
            <p className="muted-text">
              Concierge, resident support, and privilege assistance
            </p>
          </div>
        </section>

        <div className="button-row">
          <button type="button">Call Now</button>
          <button type="button" className="button-secondary">
            Open Map
          </button>
        </div>
      </div>
    </AppShell>
  );
}
