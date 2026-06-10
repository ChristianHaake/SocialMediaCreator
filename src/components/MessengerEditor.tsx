import {
  ArrowDown,
  ArrowUp,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import type {
  ImageState,
  MessengerMessage,
  MessengerState,
} from "../types";
import { ImageUploadField } from "./ImageUploadField";

type MessengerEditorProps = {
  value: MessengerState;
  onChange: Dispatch<SetStateAction<MessengerState>>;
  profileImage: ImageState | null;
  onProfileImageChange: (image: ImageState | null) => void;
  onImageError: (message: string | null) => void;
};

type MessageDraft = Omit<MessengerMessage, "id">;

const defaultDraft: MessageDraft = {
  type: "received",
  text: "",
  time: "10:00",
};

function createMessageId() {
  return globalThis.crypto?.randomUUID?.() ?? `message-${Date.now()}`;
}

export function MessengerEditor({
  value,
  onChange,
  profileImage,
  onProfileImageChange,
  onImageError,
}: MessengerEditorProps) {
  const [draft, setDraft] = useState(defaultDraft);

  function update<K extends keyof MessengerState>(
    key: K,
    nextValue: MessengerState[K],
  ) {
    onChange((current) => ({ ...current, [key]: nextValue }));
  }

  function updateMessage(
    id: string,
    changes: Partial<Omit<MessengerMessage, "id">>,
  ) {
    onChange((current) => ({
      ...current,
      messages: current.messages.map((message) =>
        message.id === id ? { ...message, ...changes } : message,
      ),
    }));
  }

  function addMessage() {
    if (!draft.text.trim()) return;

    onChange((current) => ({
      ...current,
      messages: [
        ...current.messages,
        { ...draft, id: createMessageId(), text: draft.text.trim() },
      ],
    }));
    setDraft((current) => ({ ...current, text: "" }));
  }

  function removeMessage(id: string) {
    onChange((current) => ({
      ...current,
      messages: current.messages.filter((message) => message.id !== id),
    }));
  }

  function moveMessage(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= value.messages.length) return;

    onChange((current) => {
      const messages = [...current.messages];
      [messages[index], messages[targetIndex]] = [
        messages[targetIndex],
        messages[index],
      ];
      return { ...current, messages };
    });
  }

  return (
    <form className="editor-form" onSubmit={(event) => event.preventDefault()}>
      <section className="editor-section">
        <div className="section-heading">
          <span>01</span>
          <div>
            <h2>Kontakt</h2>
            <p>Name, Bild und aktueller Status</p>
          </div>
        </div>

        <p className="editor-notice">
          Verwende fiktive Namen und keine echten privaten Chats.
        </p>

        <ImageUploadField
          id="messenger-profile-image"
          image={profileImage}
          label="Profilbild"
          onChange={onProfileImageChange}
          onError={onImageError}
        />

        <label className="field">
          <span className="field-label">Kontaktname</span>
          <input
            maxLength={40}
            onChange={(event) => update("contactName", event.target.value)}
            value={value.contactName}
          />
        </label>

        <label className="field">
          <span className="field-label">Status</span>
          <input
            maxLength={60}
            onChange={(event) => update("status", event.target.value)}
            value={value.status}
          />
        </label>
      </section>

      <section className="editor-section">
        <div className="section-heading">
          <span>02</span>
          <div>
            <h2>Neue Nachricht</h2>
            <p>Füge eine Nachricht am Ende des Verlaufs hinzu</p>
          </div>
        </div>

        <fieldset className="segmented-field">
          <legend className="field-label">Nachrichtentyp</legend>
          <div className="segmented-control">
            <label>
              <input
                checked={draft.type === "received"}
                name="new-message-type"
                onChange={() =>
                  setDraft((current) => ({
                    ...current,
                    type: "received",
                  }))
                }
                type="radio"
              />
              <span>Empfangen</span>
            </label>
            <label>
              <input
                checked={draft.type === "sent"}
                name="new-message-type"
                onChange={() =>
                  setDraft((current) => ({ ...current, type: "sent" }))
                }
                type="radio"
              />
              <span>Gesendet</span>
            </label>
          </div>
        </fieldset>

        <label className="field">
          <span className="field-label">Nachrichtentext</span>
          <textarea
            maxLength={1000}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                text: event.target.value,
              }))
            }
            placeholder="Was soll in der Nachricht stehen?"
            rows={3}
            value={draft.text}
          />
        </label>

        <div className="message-add-row">
          <label className="field field--compact">
            <span className="field-label">Uhrzeit</span>
            <input
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  time: event.target.value,
                }))
              }
              type="time"
              value={draft.time}
            />
          </label>
          <button
            className="button button--primary"
            disabled={!draft.text.trim()}
            onClick={addMessage}
            type="button"
          >
            <Plus aria-hidden="true" size={18} />
            Hinzufügen
          </button>
        </div>
      </section>

      <section className="editor-section">
        <div className="section-heading">
          <span>03</span>
          <div>
            <h2>Nachrichten</h2>
            <p>{value.messages.length} Nachrichten bearbeiten und sortieren</p>
          </div>
        </div>

        {value.messages.length === 0 ? (
          <p className="empty-state">
            Noch keine Nachrichten. Füge oben die erste Nachricht hinzu.
          </p>
        ) : (
          <ol className="message-editor-list">
            {value.messages.map((message, index) => (
              <li className="message-editor-card" key={message.id}>
                <div className="message-editor-card__header">
                  <strong>Nachricht {index + 1}</strong>
                  <div className="message-editor-card__actions">
                    <button
                      aria-label={`Nachricht ${index + 1} nach oben verschieben`}
                      className="compact-icon-button"
                      disabled={index === 0}
                      onClick={() => moveMessage(index, -1)}
                      type="button"
                    >
                      <ArrowUp aria-hidden="true" size={16} />
                    </button>
                    <button
                      aria-label={`Nachricht ${index + 1} nach unten verschieben`}
                      className="compact-icon-button"
                      disabled={index === value.messages.length - 1}
                      onClick={() => moveMessage(index, 1)}
                      type="button"
                    >
                      <ArrowDown aria-hidden="true" size={16} />
                    </button>
                    <button
                      aria-label={`Nachricht ${index + 1} löschen`}
                      className="compact-icon-button compact-icon-button--danger"
                      onClick={() => removeMessage(message.id)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={16} />
                    </button>
                  </div>
                </div>

                <label className="field">
                  <span className="field-label">Typ</span>
                  <select
                    aria-label={`Typ von Nachricht ${index + 1}`}
                    onChange={(event) =>
                      updateMessage(message.id, {
                        type: event.target.value as MessengerMessage["type"],
                      })
                    }
                    value={message.type}
                  >
                    <option value="received">Empfangen</option>
                    <option value="sent">Gesendet</option>
                  </select>
                </label>

                <label className="field">
                  <span className="field-label">Text</span>
                  <textarea
                    aria-label={`Text von Nachricht ${index + 1}`}
                    maxLength={1000}
                    onChange={(event) =>
                      updateMessage(message.id, { text: event.target.value })
                    }
                    rows={3}
                    value={message.text}
                  />
                </label>

                <label className="field">
                  <span className="field-label">Uhrzeit</span>
                  <input
                    aria-label={`Uhrzeit von Nachricht ${index + 1}`}
                    onChange={(event) =>
                      updateMessage(message.id, { time: event.target.value })
                    }
                    type="time"
                    value={message.time}
                  />
                </label>
              </li>
            ))}
          </ol>
        )}
      </section>
    </form>
  );
}
