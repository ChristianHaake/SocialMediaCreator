import type { Dispatch, SetStateAction } from "react";
import type { ImageState, MicroblogState } from "../types";
import { ImageUploadField } from "./ImageUploadField";

type MicroblogEditorProps = {
  value: MicroblogState;
  onChange: Dispatch<SetStateAction<MicroblogState>>;
  profileImage: ImageState | null;
  onProfileImageChange: (image: ImageState | null) => void;
  onImageError: (message: string | null) => void;
};

export function MicroblogEditor({
  value,
  onChange,
  profileImage,
  onProfileImageChange,
  onImageError,
}: MicroblogEditorProps) {
  function update<K extends keyof MicroblogState>(
    key: K,
    nextValue: MicroblogState[K],
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
            <p>Absender des kurzen Beitrags</p>
          </div>
        </div>

        <ImageUploadField
          id="microblog-profile-image"
          image={profileImage}
          label="Profilbild"
          onChange={onProfileImageChange}
          onError={onImageError}
        />

        <label className="field">
          <span className="field-label">Anzeigename</span>
          <input
            maxLength={50}
            onChange={(event) => update("displayName", event.target.value)}
            value={value.displayName}
          />
        </label>

        <label className="field">
          <span className="field-label">Handle</span>
          <input
            maxLength={30}
            onChange={(event) => update("handle", event.target.value)}
            value={value.handle}
          />
          <span className="field-hint">
            Das @-Zeichen wird in der Vorschau automatisch ergänzt.
          </span>
        </label>
      </section>

      <section className="editor-section">
        <div className="section-heading">
          <span>02</span>
          <div>
            <h2>Beitrag</h2>
            <p>Text und optionale Zeitangaben</p>
          </div>
        </div>

        <label className="field">
          <span className="field-label">Beitragstext</span>
          <textarea
            aria-label="Beitragstext"
            onChange={(event) => update("text", event.target.value)}
            rows={6}
            value={value.text}
          />
          <span
            className={
              value.text.length > 280
                ? "field-hint field-hint--warning"
                : "field-hint"
            }
          >
            {value.text.length} Zeichen
            {value.text.length > 280 ? " · länger als 280 Zeichen" : ""}
          </span>
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Datum</span>
            <input
              onChange={(event) => update("date", event.target.value)}
              type="date"
              value={value.date}
            />
          </label>
          <label className="field">
            <span className="field-label">Uhrzeit</span>
            <input
              onChange={(event) => update("time", event.target.value)}
              type="time"
              value={value.time}
            />
          </label>
        </div>

        <label className="toggle-field">
          <input
            checked={value.showDate}
            onChange={(event) => update("showDate", event.target.checked)}
            type="checkbox"
          />
          <span>Datum anzeigen</span>
        </label>
        <label className="toggle-field">
          <input
            checked={value.showTime}
            onChange={(event) => update("showTime", event.target.checked)}
            type="checkbox"
          />
          <span>Uhrzeit anzeigen</span>
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

        <div className="field-row field-row--three">
          <label className="field">
            <span className="field-label">Antworten</span>
            <input
              min={0}
              onChange={(event) =>
                update("replies", Math.max(0, Number(event.target.value)))
              }
              type="number"
              value={value.replies}
            />
          </label>
          <label className="field">
            <span className="field-label">Reposts</span>
            <input
              min={0}
              onChange={(event) =>
                update("reposts", Math.max(0, Number(event.target.value)))
              }
              type="number"
              value={value.reposts}
            />
          </label>
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
        </div>
      </section>
    </form>
  );
}
