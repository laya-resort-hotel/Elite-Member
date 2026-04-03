type ImageUploadBlockProps = {
  label: string;
  previewUrl?: string;
  recommendedSize: string;
  minimumSize?: string;
  ratio: string;
  acceptedTypes: string;
  maxFileSize: string;
  note?: string;
};

export function ImageUploadBlock({
  label,
  previewUrl,
  recommendedSize,
  minimumSize,
  ratio,
  acceptedTypes,
  maxFileSize,
  note,
}: ImageUploadBlockProps) {
  return (
    <section className="image-upload-block">
      <div className="image-upload-block__header">
        <div>
          <strong>{label}</strong>
          <p className="muted-text">
            Upload or replace image for this content section
          </p>
        </div>
      </div>

      <div className="image-upload-block__preview-wrap">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={label}
            className="image-upload-block__preview-image"
          />
        ) : (
          <div className="image-upload-block__preview">IMAGE PREVIEW</div>
        )}
      </div>

      <div className="image-upload-block__meta">
        <p>
          <strong>Recommended size:</strong> {recommendedSize}
        </p>
        {minimumSize ? (
          <p>
            <strong>Minimum size:</strong> {minimumSize}
          </p>
        ) : null}
        <p>
          <strong>Ratio:</strong> {ratio}
        </p>
        <p>
          <strong>Accepted:</strong> {acceptedTypes}
        </p>
        <p>
          <strong>Max file size:</strong> {maxFileSize}
        </p>
        {note ? (
          <p>
            <strong>Note:</strong> {note}
          </p>
        ) : null}
      </div>

      <div className="button-row button-row--compact">
        <button type="button">Upload Image</button>
        <button type="button" className="button-secondary">
          Replace
        </button>
        <button type="button" className="button-danger-soft">
          Remove
        </button>
      </div>
    </section>
  );
}
