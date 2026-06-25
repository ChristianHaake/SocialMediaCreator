import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { fieldLimits } from "../../domain/constraints";
import type {
  ImageState,
  MessengerImages,
  MessengerMessage,
  MessengerProfile,
  MessengerState,
} from "../../domain/types";
import { createId } from "../../shared/lib/ids";
import { useTranslation } from "../../i18n";
import { EditorDisclosure } from "../../shared/components/EditorDisclosure";
import { EmojiTextarea } from "../../shared/components/EmojiTextarea";
import { ImageUploadField } from "../../shared/components/ImageUploadField";
import { ThemeSelector } from "../../shared/components/ThemeSelector";

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
  const { locale, t } = useTranslation();
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
    if (
      !draft.text.trim() ||
      value.messages.length >= fieldLimits.messenger.messages
    ) {
      return;
    }
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

  function profileName(id: string) {
    const profile = value.profiles.find((item) => item.id === id);
    return profile?.name || profile?.side || t("common.author");
  }

  return (
    <form className="editor-form" onSubmit={(event) => event.preventDefault()}>
      <EditorDisclosure
        description={t("messenger.themeDescription")}
        number="01"
        title={t("common.appearance")}
      >
        <ThemeSelector
          onChange={(theme) => onChange((current) => ({ ...current, theme }))}
          value={value.theme}
        />
      </EditorDisclosure>

      <EditorDisclosure
        description={t("messenger.profilesDescription")}
        number="02"
        title={t("messenger.profiles")}
      >
        <p className="editor-notice">
          {t("messenger.notice")}
        </p>
        <div className="profile-editor-list">
          {value.profiles.map((profile) => (
            <details
              className="message-editor-card message-editor-card--disclosure message-editor-card--profile-disclosure"
              key={profile.id}
            >
              <summary className="message-editor-card__summary">
                <div className="message-editor-card__summary-text">
                  <strong>
                    {profile.side === "left"
                      ? t("messenger.leftProfile")
                      : t("messenger.rightProfile")}
                  </strong>
                  <span>{profile.name || t("messenger.name")}</span>
                  <small>{profile.status || t("messenger.status")}</small>
                </div>
                <ChevronDown
                  aria-hidden="true"
                  className="message-editor-card__chevron"
                  size={18}
                />
              </summary>
              <div className="message-editor-card__content message-editor-card__content--profile">
                <ImageUploadField
                  id={`messenger-profile-image-${profile.side}`}
                  image={images[profile.id] ?? null}
                  label={t("common.profileImage")}
                  onChange={(image) => onProfileImageChange(profile.id, image)}
                  onError={onImageError}
                />
                <label className="field">
                  <span className="field-label">{t("messenger.name")}</span>
                  <input
                    maxLength={fieldLimits.messenger.contactName}
                    onChange={(event) =>
                      updateProfile(profile.id, { name: event.target.value })
                    }
                    value={profile.name}
                  />
                </label>
                <label className="field">
                  <span className="field-label">{t("messenger.status")}</span>
                  <input
                    maxLength={fieldLimits.messenger.status}
                    onChange={(event) =>
                      updateProfile(profile.id, { status: event.target.value })
                    }
                    value={profile.status}
                  />
                </label>
              </div>
            </details>
          ))}
        </div>
      </EditorDisclosure>

      <EditorDisclosure
        defaultOpen
        description={t("messenger.messagesDescription", {
          count: value.messages.length,
        })}
        number="03"
        title={t("messenger.messages")}
      >
        <div className="message-composer">
          <div className="message-composer__heading">
            <h3>{t("messenger.newMessage")}</h3>
            <p>{t("messenger.newMessageDescription")}</p>
          </div>
          <div className="message-composer__grid">
            <label className="field">
              <span className="field-label">{t("messenger.sender")}</span>
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
              <span className="field-label">{t("common.timestamp")}</span>
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
          </div>
          <div className="field">
            <span className="field-label">{t("messenger.messageText")}</span>
            <EmojiTextarea
              aria-label={t("messenger.messageText")}
              maxLength={fieldLimits.messenger.messageText}
              onChange={(text) =>
                setDraft((current) => ({
                  ...current,
                  text,
                }))
              }
              placeholder={t("messenger.placeholder")}
              rows={3}
              value={draft.text}
            />
          </div>
          <div className="message-composer__actions">
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
              <span>{t("messenger.markSeen")}</span>
            </label>
            <button
              className="button button--primary"
              disabled={
                !draft.text.trim() ||
                value.messages.length >= fieldLimits.messenger.messages
              }
              onClick={addMessage}
              type="button"
            >
              <Plus aria-hidden="true" size={18} />
              {t("common.add")}
            </button>
          </div>
          {value.messages.length >= fieldLimits.messenger.messages && (
            <span className="field-hint field-hint--warning">
              {t("messenger.limitReached")}
            </span>
          )}
        </div>
        {value.messages.length === 0 ? (
          <p className="empty-state">{t("messenger.empty")}</p>
        ) : (
          <ol className="message-editor-list">
            {value.messages.map((message, index) => (
              <li key={message.id}>
                <details className="message-editor-card message-editor-card--disclosure">
                  <summary className="message-editor-card__summary">
                    <div className="message-editor-card__summary-text">
                      <strong>{t("messenger.message")} {index + 1}</strong>
                      <span>
                        {profileName(message.senderId)}
                        {message.timestamp ? ` · ${message.timestamp}` : ""}
                      </span>
                      <small>{message.text || t("messenger.emptyMessage")}</small>
                    </div>
                    <div className="message-editor-card__actions">
                      <button
                        aria-label={`${t("messenger.message")} ${index + 1} ${t("common.moveUp")}`}
                        className="compact-icon-button"
                        disabled={index === 0}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          moveMessage(index, -1);
                        }}
                        type="button"
                      >
                        <ArrowUp aria-hidden="true" size={16} />
                      </button>
                      <button
                        aria-label={`${t("messenger.message")} ${index + 1} ${t("common.moveDown")}`}
                        className="compact-icon-button"
                        disabled={index === value.messages.length - 1}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          moveMessage(index, 1);
                        }}
                        type="button"
                      >
                        <ArrowDown aria-hidden="true" size={16} />
                      </button>
                      <button
                        aria-label={`${t("messenger.message")} ${index + 1} ${t("common.delete")}`}
                        className="compact-icon-button compact-icon-button--danger"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          onChange((current) => ({
                            ...current,
                            messages: current.messages.filter(
                              (item) => item.id !== message.id,
                            ),
                          }));
                        }}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={16} />
                      </button>
                    </div>
                    <ChevronDown
                      aria-hidden="true"
                      className="message-editor-card__chevron"
                      size={18}
                    />
                  </summary>
                  <div className="message-editor-card__content">
                    <label className="field">
                      <span className="field-label">{t("messenger.sender")}</span>
                      <select
                        aria-label={
                          locale === "de"
                            ? `Absender von Nachricht ${index + 1}`
                            : `Sender of message ${index + 1}`
                        }
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
                    <div className="field">
                      <span className="field-label">{t("messenger.text")}</span>
                      <EmojiTextarea
                        aria-label={
                          locale === "de"
                            ? `Text von Nachricht ${index + 1}`
                            : `Text of message ${index + 1}`
                        }
                        maxLength={fieldLimits.messenger.messageText}
                        onChange={(text) =>
                          updateMessage(message.id, { text })
                        }
                        rows={3}
                        value={message.text}
                      />
                    </div>
                    <label className="field">
                      <span className="field-label">{t("common.timestamp")}</span>
                      <input
                        aria-label={
                          locale === "de"
                            ? `Zeitstempel von Nachricht ${index + 1}`
                            : `Timestamp of message ${index + 1}`
                        }
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
                      <span>{t("messenger.seen")}</span>
                    </label>
                  </div>
                </details>
              </li>
            ))}
          </ol>
        )}
      </EditorDisclosure>
    </form>
  );
}
