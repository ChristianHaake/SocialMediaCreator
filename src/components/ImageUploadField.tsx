import { ImagePlus, Trash2 } from "lucide-react";
import type { ChangeEvent } from "react";
import type { ImageState } from "../types";
import { createImageState, validateImageFile } from "../utils/imageFiles";

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
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const error = validateImageFile(file);
    if (error) {
      onError(error);
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
          {image ? "Bild ersetzen" : "Bild auswählen"}
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
            aria-label={`${label} entfernen`}
            className="icon-button"
            onClick={() => onChange(null)}
            type="button"
          >
            <Trash2 aria-hidden="true" size={18} />
          </button>
        )}
      </div>
      <span className="field-hint">
        {image?.fileName ?? "PNG, JPG oder WebP, maximal 10 MB"}
      </span>
    </div>
  );
}
