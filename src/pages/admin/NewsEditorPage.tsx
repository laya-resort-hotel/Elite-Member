import { useState } from "react";
import { AdminShell } from "../../components/admin/AdminShell";
import { ImageUploadBlock } from "../../components/admin/ImageUploadBlock";
import { createNews } from "../../services/content.service";
import { uploadContentImage } from "../../services/media.service";

export default function NewsEditorPage() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [status, setStatus] = useState("draft");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    setMessage("");
    try {
      const created = await createNews({
        title,
        subtitle,
        summary,
        body,
        publishDate,
        status,
        coverImage: "",
      });

      let coverImage = "";
      if (coverFile) {
        coverImage = await uploadContentImage({
          file: coverFile,
          contentType: "news",
          docId: created.id,
          slot: "cover",
        });
      }

      if (coverImage) {
        const { updateNews } = await import("../../services/content.service");
        await updateNews(created.id, { coverImage });
      }

      setMessage("News saved successfully.");
    } catch (error) {
      setMessage("Unable to save news.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title="News Editor">
      <div className="content-editor-layout">
        <section className="content-editor-main">
          <div className="form-section-card">
            <h2>Basic Information</h2>
            <div className="form-stack">
              <label className="field-stack">
                <span>News Title</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label className="field-stack">
                <span>Subtitle</span>
                <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              </label>
              <label className="field-stack">
                <span>Summary</span>
                <input value={summary} onChange={(e) => setSummary(e.target.value)} />
              </label>
              <label className="field-stack">
                <span>Body</span>
                <textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
              </label>
              <label className="field-stack">
                <span>Publish Date</span>
                <input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
              </label>
              <label className="field-stack">
                <span>Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </div>
          </div>

          <div className="form-section-card">
            <ImageUploadBlock
              label="News Cover Image"
              previewUrl={coverPreview}
              recommendedSize="1200 × 675 px"
              minimumSize="960 × 540 px"
              ratio="16:9"
              acceptedTypes="JPG, PNG, WEBP"
              maxFileSize="1.5 MB"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setCoverFile(file);
                setCoverPreview(file ? URL.createObjectURL(file) : "");
              }}
            />
          </div>

          {message ? <div className="success-panel">{message}</div> : null}

          <div className="button-row">
            <button type="button" onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : "Save News"}
            </button>
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
