export default function ScanSpendPage() {
  return (
    <div className="stack-lg">
      <section className="panel centered-panel">
        <div className="scan-frame">QR Scanner Area</div>
        <p className="muted centered-text">
          Connect a camera-based QR scanner here. After scanning, load member data and post spend to point
          transactions.
        </p>
      </section>

      <section className="panel form-panel">
        <h3>Manual Spend Entry</h3>
        <div className="form-grid">
          <label>
            Member ID
            <input placeholder="LAYA-RS-0007" />
          </label>
          <label>
            Outlet
            <select defaultValue="">
              <option value="" disabled>
                Select outlet
              </option>
              <option>Aroonsawat</option>
              <option>The Taste</option>
              <option>Mangrove</option>
              <option>Spa</option>
            </select>
          </label>
          <label>
            Spend Amount
            <input placeholder="0.00" type="number" />
          </label>
          <label>
            Point Rate
            <input placeholder="10 baht = 1 point" />
          </label>
        </div>
        <div className="inline-actions">
          <button className="primary-button" type="button">
            Save Transaction
          </button>
          <button className="secondary-button" type="button">
            Reset
          </button>
        </div>
      </section>
    </div>
  );
}
