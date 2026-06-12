import { ImagePlus, Trash2 } from "lucide-react";
import type { ChangeEvent } from "react";
import type { ImageState } from "../../domain/types";
import { useTranslation } from "../../i18n";
import { createImageState, validateImageFile } from "../lib/imageFiles";

type ImageUploadFieldProps = {
  id: string;
  label: string;
  image: ImageState | null;
  onChange: (image: ImageState | null) => void;
  onError: (message: string | null) => void;
};

export function ImageUploadField({
  id,
  label,
  image,
  onChange,
  onError,
}: ImageUploadFieldProps) {
  const { t } = useTranslation();
  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const error = await validateImageFile(file);
    if (error) {
      onError(t(error));
      return;
    }

    onError(null);
    onChange(createImageState(file));
  }

  return (
    <div className="image-upload">
      <span className="field-label">{label}</span>
      <div className="image-upload__actions">
        <label className="button button--secondary" htmlFor={id}>
          <ImagePlus aria-hidden="true" size={18} />
          {image ? t("image.replace") : t("image.choose")}
        </label>
        <input
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          className="visually-hidden"
          id={id}
          onChange={handleFileChange}
          type="file"
        />
        {image && (
          <button
            aria-label={t("image.remove", { label })}
            className="icon-button"
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
