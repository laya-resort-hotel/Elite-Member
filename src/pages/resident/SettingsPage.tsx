import { AppShell } from "../../components/shared/AppShell";
import { useAuth } from "../../app/providers/AuthProvider";

export default function SettingsPage() {
  const { signOutApp } = useAuth();

  return (
    <AppShell title="Settings" showBackButton>
      <div className="page-stack">
        <section className="info-panel">
          <strong>Preferences</strong>
          <div className="settings-list">
            <label className="settings-row">
              <span>Language</span>
              <select defaultValue="en">
                <option value="en">English</option>
                <option value="th">ไทย</option>
              </select>
            </label>

            <label className="settings-row">
              <span>Notifications</span>
              <select defaultValue="enabled">
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
          </div>
        </section>

        <section className="info-panel">
          <strong>Privacy</strong>
          <div className="stack-sm">
            <p className="muted-text">Privacy Policy</p>
            <p className="muted-text">Terms & Conditions</p>
          </div>
        </section>

        <button type="button" className="button-danger-soft" onClick={signOutApp}>
          Log Out
        </button>
      </div>
    </AppShell>
  );
}
