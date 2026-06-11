import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { fieldLimits } from "../constraints";
import type {
  ImageState,
  MessengerImages,
  MessengerMessage,
  MessengerProfile,
  MessengerState,
} from "../types";
import { createId } from "../utils/ids";
import { ImageUploadField } from "./ImageUploadField";
import { ThemeSelector } from "./ThemeSelector";

type MessengerEditorProps = {
  value: MessengerState;
  onChange: Dispatch<SetStateAction<MessengerState>>;
  images: MessengerImages;
  onProfileImageChange: (profileId: string, image: ImageState | null) => void;
  onImageError: (message: string | null) => void;
};

type MessageDraft = Omit<MessengerMessage, "id">;

export function MessengerEditor({
  value,
  onChange,
  images,
  onProfileImageChange,
  onImageError,
}: MessengerEditorProps) {
  const [draft, setDraft] = useState<MessageDraft>({
    senderId: value.profiles[0].id,
    text: "",
    timestamp: "10:00",
    seen: false,
  });

  function updateProfile(
    id: string,
    changes: Partial<Omit<MessengerProfile, "id" | "side">>,
  ) {
    onChange((current) => ({
      ...current,
      profiles: current.profiles.map((profile) =>
        profile.id === id ? { ...profile, ...changes } : profile,
      ) as MessengerState["profiles"],
    }));
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
        { ...draft, id: createId("message"), text: draft.text.trim() },
      ],
    }));
    setDraft((current) => ({ ...current, text: "" }));
  }

  function moveMessage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.messages.length) return;
    onChange((current) => {
      const messages = [...current.messages];
      [messages[index], messages[target]] = [
        messages[target],
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
            <h2>Darstellung</h2>
            <p>Farbschema des Messenger-Chats</p>
          </div>
        </div>
        <ThemeSelector
          onChange={(theme) => onChange((current) => ({ ...current, theme }))}
          value={value.theme}
        />
      </section>

      <section className="editor-section">
        <div className="section-heading">
          <span>02</span>
          <div>
            <h2>Chat-Profile</h2>
            <p>Zwei feste Seiten mit frei editierbaren Profilen</p>
          </div>
        </div>
        <p className="editor-notice">
          Verwende fiktive Namen und keine echten privaten Chats.
        </p>
        <div className="profile-editor-list">
          {value.profiles.map((profile) => (
            <div className="message-editor-card" key={profile.id}>
              <strong>
                {profile.side === "left" ? "Profil links" : "Profil rechts"}
              </strong>
              <ImageUploadField
                id={`messenger-profile-image-${profile.side}`}
                image={images[profile.id] ?? null}
                label="Profilbild"
                onChange={(image) => onProfileImageChange(profile.id, image)}
                onError={onImageError}
              />
              <label className="field">
                <span className="field-label">Name</span>
                <input
                  maxLength={fieldLimits.messenger.contactName}
                  onChange={(event) =>
                    updateProfile(profile.id, { name: event.target.value })
                  }
                  value={profile.name}
                />
              </label>
              <label className="field">
                <span className="field-label">Online-Status</span>
                <input
                  maxLength={fieldLimits.messenger.status}
                  onChange={(event) =>
                    updateProfile(profile.id, { status: event.target.value })
                  }
                  value={profile.status}
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="editor-section">
        <div className="section-heading">
          <span>03</span>
          <div>
            <h2>Neue Nachricht</h2>
            <p>Nachricht einem der beiden Profile zuweisen</p>
          </div>
        </div>
        <label className="field">
          <span className="field-label">Absender</span>
          <select
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                senderId: event.target.value,
              }))
            }
            value={draft.senderId}
          >
            {value.profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name || profile.side}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Nachrichtentext</span>
          <textarea
            maxLength={fieldLimits.messenger.messageText}
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
        <label className="field">
          <span className="field-label">Zeitstempel</span>
          <input
            maxLength={fieldLimits.common.timestamp}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                timestamp: event.target.value,
              }))
            }
            value={draft.timestamp}
          />
        </label>
        <label className="toggle-field">
          <input
            checked={draft.seen}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                seen: event.target.checked,
              }))
            }
            type="checkbox"
          />
          <span>Als gelesen oder gesehen markieren</span>
        </label>
        <button
          className="button button--primary full-width-button"
          disabled={!draft.text.trim()}
          onClick={addMessage}
          type="button"
        >
          <Plus aria-hidden="true" size={18} />
          Hinzufügen
        </button>
      </section>

      <section className="editor-section">
        <div className="section-heading">
          <span>04</span>
          <div>
            <h2>Nachrichten</h2>
            <p>{value.messages.length} Nachrichten bearbeiten und sortieren</p>
          </div>
        </div>
        {value.messages.length === 0 ? (
          <p className="empty-state">Noch keine Nachrichten.</p>
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
                      onClick={() =>
                        onChange((current) => ({
                          ...current,
                          messages: current.messages.filter(
                            (item) => item.id !== message.id,
                          ),
                        }))
                      }
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={16} />
                    </button>
                  </div>
                </div>
                <label className="field">
                  <span className="field-label">Absender</span>
                  <select
                    aria-label={`Absender von Nachricht ${index + 1}`}
                    onChange={(event) =>
                      updateMessage(message.id, {
                        senderId: event.target.value,
                      })
                    }
                    value={message.senderId}
                  >
                    {value.profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name || profile.side}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">Text</span>
                  <textarea
                    aria-label={`Text von Nachricht ${index + 1}`}
                    maxLength={fieldLimits.messenger.messageText}
                    onChange={(event) =>
                      updateMessage(message.id, { text: event.target.value })
                    }
                    rows={3}
                    value={message.text}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Zeitstempel</span>
                  <input
                    aria-label={`Zeitstempel von Nachricht ${index + 1}`}
                    maxLength={fieldLimits.common.timestamp}
                    onChange={(event) =>
                      updateMessage(message.id, {
                        timestamp: event.target.value,
                      })
                    }
                    value={message.timestamp}
                  />
                </label>
                <label className="toggle-field">
                  <input
                    checked={message.seen}
                    onChange={(event) =>
                      updateMessage(message.id, { seen: event.target.checked })
                    }
                    type="checkbox"
                  />
                  <span>Gelesen oder gesehen</span>
                </label>
              </li>
            ))}
          </ol>
        )}
      </section>
    </form>
  );
}
