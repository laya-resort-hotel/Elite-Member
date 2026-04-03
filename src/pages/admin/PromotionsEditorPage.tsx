import { useState } from "react";
import { AdminShell } from "../../components/admin/AdminShell";
import { ImageUploadBlock } from "../../components/admin/ImageUploadBlock";
import { createPromotion, updatePromotion } from "../../services/content.service";
import { uploadContentImage } from "../../services/media.service";

export default function PromotionsEditorPage() {
  const [title, setTitle] = useState("");
  const [outlet, setOutlet] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [terms, setTerms] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("draft");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [detailFile, setDetailFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [detailPreview, setDetailPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit() {
    setSaving(true);
    setMessage("");
    try {
      const created = await createPromotion({
        title,
        outlet,
        summary,
        description,
        terms,
        startDate,
        endDate,
        status,
        bannerImage: "",
        detailImage: "",
      });

      const patch: Record<string, string> = {};

      if (bannerFile) {
        patch.bannerImage = await uploadContentImage({
          file: bannerFile,
          contentType: "promotions",
          docId: created.id,
          slot: "banner",
        });
      }

      if (detailFile) {
        patch.detailImage = await uploadContentImage({
          file: detailFile,
          contentType: "promotions",
          docId: created.id,
          slot: "detail",
        });
      }

      if (Object.keys(patch).length > 0) {
        await updatePromotion(created.id, patch);
      }

      setMessage("Promotion saved successfully.");
    } catch {
      setMessage("Unable to save promotion.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title="Promotions Editor">
      <div className="content-editor-layout">
        <section className="content-editor-main">
          <div className="form-section-card">
            <h2>Promotion Information</h2>
            <div className="form-stack">
              <label className="field-stack"><span>Promotion Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
              <label className="field-stack"><span>Outlet</span><input value={outlet} onChange={(e) => setOutlet(e.target.value)} /></label>
              <label className="field-stack"><span>Summary</span><input value={summary} onChange={(e) => setSummary(e.target.value)} /></label>
              <label className="field-stack"><span>Description</span><textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
              <label className="field-stack"><span>Terms</span><textarea rows={4} value={terms} onChange={(e) => setTerms(e.target.value)} /></label>
              <label className="field-stack"><span>Start Date</span><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
              <label className="field-stack"><span>End Date</span><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>
              <label className="field-stack"><span>Status</span><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Scheduled</option><option value="expired">Expired</option></select></label>
            </div>
          </div>

          <div className="form-section-card">
            <ImageUploadBlock label="Promotion Banner" previewUrl={bannerPreview} recommendedSize="1200 × 675 px" minimumSize="960 × 540 px" ratio="16:9" acceptedTypes="JPG, PNG, WEBP" maxFileSize="1.5 MB" />
            <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0] ?? null; setBannerFile(file); setBannerPreview(file ? URL.createObjectURL(file) : ""); }} />
          </div>

          <div className="form-section-card">
            <ImageUploadBlock label="Promotion Detail Image" previewUrl={detailPreview} recommendedSize="1240 × 1600 px" minimumSize="900 × 1200 px" ratio="4:5" acceptedTypes="JPG, PNG, WEBP" maxFileSize="2 MB" />
            <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0] ?? null; setDetailFile(file); setDetailPreview(file ? URL.createObjectURL(file) : ""); }} />
          </div>

          {message ? <div className="success-panel">{message}</div> : null}
          <div className="button-row"><button type="button" onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : "Save Promotion"}</button></div>
        </section>

        <aside className="content-editor-side"><div className="info-panel"><strong>Mobile Preview</strong><div className="preview-box">PROMOTION PREVIEW</div></div></aside>
      </div>
    </AdminShell>
  );
}
