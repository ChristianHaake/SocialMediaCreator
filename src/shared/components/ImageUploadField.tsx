import { ImagePlus, Trash2 } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import type { ImageState } from "../../domain/types";
import { useTranslation } from "../../i18n";
import { prepareImageForUpload } from "../lib/imageFiles";

type ImageUploadFieldProps = {
  id: string;
  label: string;
  // Screen-reader-only addition that tells repeated fields apart,
  // e.g. "Comment 2" for each comment's profile image.
  context?: string;
  image: ImageState | null;
  onChange: (image: ImageState | null) => void;
  onError: (message: string | null) => void;
};

export function ImageUploadField({
  id,
  label,
  context,
  image,
  onChange,
  onError,
}: ImageUploadFieldProps) {
  const fullLabel = context ? `${label} – ${context}` : label;
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);
  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || processing) {
      return;
    }

    setProcessing(true);
    onError(null);
    try {
      const result = await prepareImageForUpload(file);
      if ("error" in result) {
        onError(t(result.error));
        return;
      }
      onChange(result.image);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="image-upload">
      <span className="field-label" id={`${id}-label`}>
        {label}
        {context && <span className="visually-hidden"> – {context}</span>}
      </span>
      <div className="image-upload__actions">
        <label
          aria-disabled={processing}
          className="button button--secondary"
          htmlFor={id}
          id={`${id}-action`}
        >
          <ImagePlus aria-hidden="true" size={18} />
          {processing
            ? t("image.processing")
            : image
              ? t("image.replace")
              : t("image.choose")}
        </label>
        <input
          aria-labelledby={`${id}-label ${id}-action`}
          accept=".jpg,.jpeg,.png,.webp,.avif,.gif,.heic,image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic"
          className="visually-hidden"
          disabled={processing}
          id={id}
          onChange={handleFileChange}
          type="file"
        />
        {image && (
          <button
            aria-label={t("image.remove", { label: fullLabel })}
            className="icon-button"
            disabled={processing}
            onClick={() => onChange(null)}
            type="button"
          >
            <Trash2 aria-hidden="true" size={18} />
          </button>
        )}
      </div>
      <span className="field-hint">
        {image?.fileName ?? t("image.hint")}
      </span>
    </div>
  );
}
