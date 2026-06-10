import type { Dispatch, SetStateAction } from "react";
import type { ImageState, PhotoPostState } from "../types";
import { ImageUploadField } from "./ImageUploadField";

type PhotoPostEditorProps = {
  value: PhotoPostState;
  onChange: Dispatch<SetStateAction<PhotoPostState>>;
  profileImage: ImageState | null;
  postImage: ImageState | null;
  onProfileImageChange: (image: ImageState | null) => void;
  onPostImageChange: (image: ImageState | null) => void;
  onImageError: (message: string | null) => void;
};

export function PhotoPostEditor({
  value,
  onChange,
  profileImage,
  postImage,
  onProfileImageChange,
  onPostImageChange,
  onImageError,
}: PhotoPostEditorProps) {
  function update<K extends keyof PhotoPostState>(
    key: K,
    nextValue: PhotoPostState[K],
  ) {
    onChange((current) => ({ ...current, [key]: nextValue }));
  }

  return (
    <form className="editor-form" onSubmit={(event) => event.preventDefault()}>
      <section className="editor-section">
        <div className="section-heading">
          <span>01</span>
          <div>
            <h2>Profil</h2>
            <p>Absender und Kontext des Beitrags</p>
          </div>
        </div>

        <ImageUploadField
          id="profile-image"
          image={profileImage}
          label="Profilbild"
          onChange={onProfileImageChange}
          onError={onImageError}
        />

        <label className="field">
          <span className="field-label">Benutzername</span>
          <input
            maxLength={30}
            onChange={(event) => update("username", event.target.value)}
            value={value.username}
          />
        </label>

        <label className="field">
          <span className="field-label">Ort</span>
          <input
            maxLength={50}
            onChange={(event) => update("location", event.target.value)}
            value={value.location}
          />
        </label>

        <label className="toggle-field">
          <input
            checked={value.showLocation}
            onChange={(event) => update("showLocation", event.target.checked)}
            type="checkbox"
          />
          <span>Ort in der Vorschau anzeigen</span>
        </label>
      </section>

      <section className="editor-section">
        <div className="section-heading">
          <span>02</span>
          <div>
            <h2>Beitrag</h2>
            <p>Bild und Beschreibung des Inhalts</p>
          </div>
        </div>

        <ImageUploadField
          id="post-image"
          image={postImage}
          label="Beitragsbild"
          onChange={onPostImageChange}
          onError={onImageError}
        />

        <label className="field">
          <span className="field-label">Beschreibung</span>
          <textarea
            maxLength={500}
            onChange={(event) => update("caption", event.target.value)}
            rows={4}
            value={value.caption}
          />
          <span className="field-hint">{value.caption.length} / 500 Zeichen</span>
        </label>

        <label className="field">
          <span className="field-label">Alternativtext</span>
          <input
            maxLength={160}
            onChange={(event) => update("imageAlt", event.target.value)}
            placeholder="Was ist auf dem Bild zu sehen?"
            value={value.imageAlt}
          />
        </label>
      </section>

      <section className="editor-section">
        <div className="section-heading">
          <span>03</span>
          <div>
            <h2>Reaktionen</h2>
            <p>Fiktive Kennzahlen des Beitrags</p>
          </div>
        </div>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Likes</span>
            <input
              min={0}
              onChange={(event) =>
                update("likes", Math.max(0, Number(event.target.value)))
              }
              type="number"
              value={value.likes}
            />
          </label>
          <label className="field">
            <span className="field-label">Kommentare</span>
            <input
              min={0}
              onChange={(event) =>
                update("comments", Math.max(0, Number(event.target.value)))
              }
              type="number"
              value={value.comments}
            />
          </label>
        </div>

        <label className="toggle-field">
          <input
            checked={value.showComments}
            onChange={(event) => update("showComments", event.target.checked)}
            type="checkbox"
          />
          <span>Kommentarzeile anzeigen</span>
        </label>
      </section>
    </form>
  );
}
