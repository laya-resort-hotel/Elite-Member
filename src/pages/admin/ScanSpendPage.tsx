import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saveManualSpendEntry } from '../../lib/services/adminService';

export default function ScanSpendPage() {
  const { user } = useAuth();
  const [memberId, setMemberId] = useState('');
  const [outlet, setOutlet] = useState('Aroonsawat');
  const [spendAmount, setSpendAmount] = useState('');
  const [pointRate, setPointRate] = useState('10');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    if (!user) return;

    try {
      setSaving(true);
      const result = await saveManualSpendEntry({
        memberId,
        outlet,
        spendAmount: Number(spendAmount),
        pointRateBahtPerPoint: Number(pointRate),
        operator: user
      });
      setMessage(`Saved successfully. ${result.points} points were added.`);
      setSpendAmount('');
      setMemberId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save transaction.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack-lg">
      <section className="panel centered-panel">
        <div className="scan-frame">QR Scanner Area</div>
        <p className="muted centered-text">
          You can connect a QR scanner library later. For now, this page already writes real point transactions to Firestore through manual entry.
        </p>
      </section>

      <section className="panel form-panel">
        <h3>Manual Spend Entry</h3>
        <form className="stack-md" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Member ID
              <input value={memberId} onChange={(event) => setMemberId(event.target.value)} placeholder="LAYA-RS-0007" required />
            </label>
            <label>
              Outlet
              <select value={outlet} onChange={(event) => setOutlet(event.target.value)}>
                <option>Aroonsawat</option>
                <option>The Taste</option>
                <option>Mangrove</option>
                <option>Spa</option>
              </select>
            </label>
            <label>
              Spend Amount
              <input value={spendAmount} onChange={(event) => setSpendAmount(event.target.value)} placeholder="0.00" type="number" min="0" step="0.01" required />
            </label>
            <label>
              Baht per 1 point
              <input value={pointRate} onChange={(event) => setPointRate(event.target.value)} placeholder="10" type="number" min="1" required />
            </label>
          </div>
          {message ? <div className="success-text">{message}</div> : null}
          {error ? <div className="error-text">{error}</div> : null}
          <div className="inline-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Transaction'}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setMemberId('');
                setOutlet('Aroonsawat');
                setSpendAmount('');
                setPointRate('10');
                setMessage('');
                setError('');
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
