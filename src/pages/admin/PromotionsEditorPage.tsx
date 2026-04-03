import { AdminShell } from "../../components/admin/AdminShell";
import { ImageUploadBlock } from "../../components/admin/ImageUploadBlock";

export default function PromotionsEditorPage() {
  return (
    <AdminShell title="Promotions Editor">
      <div className="content-editor-layout">
        <section className="content-editor-main">
          <div className="form-section-card">
            <h2>Promotion Information</h2>
            <div className="form-stack">
              <label className="field-stack">
                <span>Promotion Title</span>
                <input placeholder="Enter promotion title" />
              </label>

              <label className="field-stack">
                <span>Outlet</span>
                <select defaultValue="">
                  <option value="">Select outlet</option>
                  <option value="the-taste">The Taste</option>
                  <option value="aroonsawat">Aroonsawat</option>
                  <option value="mangrove">Mangrove</option>
                </select>
              </label>

              <label className="field-stack">
                <span>Summary</span>
                <input placeholder="Short promotion summary" />
              </label>

              <label className="field-stack">
                <span>Description</span>
                <textarea rows={8} placeholder="Promotion detail" />
              </label>

              <label className="field-stack">
                <span>Terms & Conditions</span>
                <textarea rows={5} placeholder="Terms and conditions" />
              </label>
            </div>
          </div>

          <ImageUploadBlock
            label="Promotion Banner"
            previewUrl="https://placehold.co/1200x675"
            recommendedSize="1200 × 675 px"
            minimumSize="960 × 540 px"
            ratio="16:9"
            acceptedTypes="JPG, PNG, WEBP"
            maxFileSize="1.5 MB"
            note="Used on resident promotions list."
          />

          <ImageUploadBlock
            label="Promotion Detail Image"
            previewUrl="https://placehold.co/1240x1600"
            recommendedSize="1240 × 1600 px"
            minimumSize="900 × 1200 px"
            ratio="4:5"
            acceptedTypes="JPG, PNG, WEBP"
            maxFileSize="2 MB"
            note="Best for promotion detail page on mobile."
          />

          <div className="form-section-card">
            <h2>Schedule</h2>
            <div className="form-stack">
              <label className="field-stack">
                <span>Start Date</span>
                <input type="date" />
              </label>

              <label className="field-stack">
                <span>End Date</span>
                <input type="date" />
              </label>

              <label className="field-stack">
                <span>Status</span>
                <select defaultValue="draft">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="expired">Expired</option>
                </select>
              </label>
            </div>
          </div>

          <div className="button-row">
            <button type="button">Save Draft</button>
            <button type="button" className="button-secondary">
              Preview
            </button>
            <button type="button">Publish Promotion</button>
          </div>
        </section>

        <aside className="content-editor-side">
          <div className="info-panel">
            <strong>Mobile Preview</strong>
            <div className="preview-box">PROMOTION PREVIEW</div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
