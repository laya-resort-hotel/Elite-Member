import { AdminShell } from "../../components/admin/AdminShell";
import { ImageUploadBlock } from "../../components/admin/ImageUploadBlock";

export default function BenefitsEditorPage() {
  return (
    <AdminShell title="Benefits Editor">
      <div className="content-editor-layout">
        <section className="content-editor-main">
          <div className="form-section-card">
            <h2>Benefit Information</h2>
            <div className="form-stack">
              <label className="field-stack">
                <span>Benefit Title</span>
                <input placeholder="Enter benefit title" />
              </label>

              <label className="field-stack">
                <span>Category</span>
                <select defaultValue="">
                  <option value="">Select category</option>
                  <option value="dining">Dining</option>
                  <option value="spa">Spa</option>
                  <option value="owner-perks">Owner Perks</option>
                  <option value="events">Events</option>
                </select>
              </label>

              <label className="field-stack">
                <span>Short Description</span>
                <input placeholder="Short description for benefit card" />
              </label>

              <label className="field-stack">
                <span>Full Description</span>
                <textarea rows={8} placeholder="Full benefit description" />
              </label>

              <label className="field-stack">
                <span>Sort Order</span>
                <input type="number" placeholder="1" />
              </label>
            </div>
          </div>

          <ImageUploadBlock
            label="Benefit Icon"
            previewUrl="https://placehold.co/256x256"
            recommendedSize="256 × 256 px"
            minimumSize="128 × 128 px"
            ratio="1:1"
            acceptedTypes="PNG, WEBP"
            maxFileSize="300 KB"
            note="Use a simple clean icon with transparent background."
          />

          <ImageUploadBlock
            label="Benefit Cover Image"
            previewUrl="https://placehold.co/1080x1080"
            recommendedSize="1080 × 1080 px"
            minimumSize="800 × 800 px"
            ratio="1:1"
            acceptedTypes="JPG, PNG, WEBP"
            maxFileSize="1 MB"
            note="Used in benefit detail presentation."
          />

          <div className="form-section-card">
            <h2>Status</h2>
            <div className="form-stack">
              <label className="field-stack">
                <span>Benefit Status</span>
                <select defaultValue="active">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
          </div>

          <div className="button-row">
            <button type="button">Save Draft</button>
            <button type="button" className="button-secondary">
              Preview
            </button>
            <button type="button">Activate Benefit</button>
          </div>
        </section>

        <aside className="content-editor-side">
          <div className="info-panel">
            <strong>Mobile Preview</strong>
            <div className="preview-box">BENEFIT PREVIEW</div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
