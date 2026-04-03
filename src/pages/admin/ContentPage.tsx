export default function ContentPage() {
  return (
    <div className="stack-lg">
      <section className="panel form-panel">
        <div className="section-head">
          <h3>News Editor</h3>
          <button className="primary-button" type="button">
            Publish
          </button>
        </div>
        <div className="form-grid single-column">
          <label>
            Title
            <input placeholder="Resident Spring Preview" />
          </label>
          <label>
            Category
            <select defaultValue="News">
              <option>News</option>
              <option>Promotion</option>
            </select>
          </label>
          <label>
            Summary
            <textarea rows={4} placeholder="Write a polished summary for resident members..." />
          </label>
        </div>
      </section>

      <section className="panel form-panel">
        <div className="section-head">
          <h3>Benefit Editor</h3>
          <button className="secondary-button" type="button">
            Save Draft
          </button>
        </div>
        <div className="form-grid single-column">
          <label>
            Benefit Title
            <input placeholder="Dining Privilege" />
          </label>
          <label>
            Description
            <textarea rows={4} placeholder="Describe the benefit clearly for resident members..." />
          </label>
        </div>
      </section>
    </div>
  );
}
