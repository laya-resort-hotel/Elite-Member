import { useState } from "react";
import { AdminShell } from "../../components/admin/AdminShell";
import { ImageUploadBlock } from "../../components/admin/ImageUploadBlock";
import { createBenefit, updateBenefit } from "../../services/content.service";
import { uploadContentImage } from "../../services/media.service";

export default function BenefitsEditorPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(1);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit() {
    setSaving(true);
    setMessage("");
    try {
      const created = await createBenefit({
        title,
        category,
        shortDescription,
        fullDescription,
        sortOrder,
        status,
      });

      const patch: Record<string, string> = {};

      if (iconFile) {
        patch.iconImage = await uploadContentImage({
          file: iconFile,
          contentType: "benefits",
          docId: created.id,
          slot: "icon",
        });
      }
      if (coverFile) {
        patch.coverImage = await uploadContentImage({
          file: coverFile,
          contentType: "benefits",
          docId: created.id,
          slot: "cover",
        });
      }

      if (Object.keys(patch).length > 0) {
        await updateBenefit(created.id, patch);
      }

      setMessage("Benefit saved successfully.");
    } catch {
      setMessage("Unable to save benefit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title="Benefits Editor">
      <div className="content-editor-layout">
        <section className="content-editor-main">
          <div className="form-section-card">
            <h2>Benefit Information</h2>
            <div className="form-stack">
              <label className="field-stack"><span>Benefit Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
              <label className="field-stack"><span>Category</span><input value={category} onChange={(e) => setCategory(e.target.value)} /></label>
              <label className="field-stack"><span>Short Description</span><input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} /></label>
              <label className="field-stack"><span>Full Description</span><textarea rows={6} value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} /></label>
              <label className="field-stack"><span>Sort Order</span><input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value) || 1)} /></label>
              <label className="field-stack"><span>Status</span><select value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive")}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
            </div>
          </div>

          <div className="form-section-card">
            <ImageUploadBlock label="Benefit Icon" previewUrl={iconPreview} recommendedSize="256 × 256 px" minimumSize="128 × 128 px" ratio="1:1" acceptedTypes="PNG, WEBP" maxFileSize="300 KB" />
            <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0] ?? null; setIconFile(file); setIconPreview(file ? URL.createObjectURL(file) : ""); }} />
          </div>

          <div className="form-section-card">
            <ImageUploadBlock label="Benefit Cover Image" previewUrl={coverPreview} recommendedSize="1080 × 1080 px" minimumSize="800 × 800 px" ratio="1:1" acceptedTypes="JPG, PNG, WEBP" maxFileSize="1 MB" />
            <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0] ?? null; setCoverFile(file); setCoverPreview(file ? URL.createObjectURL(file) : ""); }} />
          </div>

          {message ? <div className="success-panel">{message}</div> : null}
          <div className="button-row"><button type="button" onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : "Save Benefit"}</button></div>
        </section>

        <aside className="content-editor-side"><div className="info-panel"><strong>Mobile Preview</strong><div className="preview-box">BENEFIT PREVIEW</div></div></aside>
      </div>
    </AdminShell>
  );
}
