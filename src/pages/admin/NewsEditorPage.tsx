import { AdminShell } from "../../components/admin/AdminShell";
import { ImageUploadBlock } from "../../components/admin/ImageUploadBlock";

export default function NewsEditorPage() {
  return (
    <AdminShell title="News Editor">
      <div className="content-editor-layout">
        <section className="content-editor-main">
          <div className="form-section-card">
            <h2>Basic Information</h2>
            <div className="form-stack">
              <label className="field-stack">
                <span>News Title</span>
                <input placeholder="Enter news title" />
              </label>

              <label className="field-stack">
                <span>Subtitle</span>
                <input placeholder="Optional subtitle" />
              </label>

              <label className="field-stack">
                <span>Summary</span>
                <input placeholder="Short summary for news card" />
              </label>

              <label className="field-stack">
                <span>Body</span>
                <textarea rows={8} placeholder="Full news content" />
              </label>
            </div>
          </div>

          <ImageUploadBlock
            label="News Cover Image"
            previewUrl="https://placehold.co/1200x675"
            recommendedSize="1200 × 675 px"
            minimumSize="960 × 540 px"
            ratio="16:9"
            acceptedTypes="JPG, PNG, WEBP"
            maxFileSize="1.5 MB"
            note="Best for featured news card and detail page cover."
          />

          <div className="form-section-card">
            <h2>Publish Settings</h2>
            <div className="form-stack">
              <label className="field-stack">
                <span>Status</span>
                <select defaultValue="draft">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              <label className="field-stack">
                <span>Publish Date</span>
                <input type="date" />
              </label>

              <label className="field-stack">
                <span>Expire Date</span>
                <input type="date" />
              </label>
            </div>
          </div>

          <div className="button-row">
            <button type="button">Save Draft</button>
            <button type="button" className="button-secondary">
              Preview
            </button>
            <button type="button">Publish News</button>
          </div>
        </section>

        <aside className="content-editor-side">
          <div className="info-panel">
            <strong>Mobile Preview</strong>
            <div className="preview-box">NEWS PREVIEW</div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
