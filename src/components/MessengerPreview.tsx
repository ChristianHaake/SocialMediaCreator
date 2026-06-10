import { ArrowLeft, CheckCheck, MoreVertical, Phone, Video } from "lucide-react";
import { forwardRef } from "react";
import type { ImageState, MessengerState } from "../types";

type MessengerPreviewProps = {
  value: MessengerState;
  profileImage: ImageState | null;
};

function initialFor(contactName: string) {
  return contactName.trim().charAt(0).toUpperCase() || "K";
}

export const MessengerPreview = forwardRef<
  HTMLDivElement,
  MessengerPreviewProps
>(function MessengerPreview({ value, profileImage }, ref) {
  const contactName = value.contactName.trim() || "Kontakt";

  return (
    <div className="messenger-preview" ref={ref}>
      <div className="messenger-preview__header">
        <ArrowLeft aria-hidden="true" size={20} />
        {profileImage ? (
          <img
            alt=""
            className="messenger-preview__avatar"
            src={profileImage.url}
          />
        ) : (
          <div className="messenger-preview__avatar messenger-preview__avatar--initial">
            {initialFor(contactName)}
          </div>
        )}
        <div className="messenger-preview__identity">
          <strong>{contactName}</strong>
          <span>{value.status.trim() || "zuletzt online"}</span>
        </div>
        <Video aria-hidden="true" size={20} />
        <Phone aria-hidden="true" size={19} />
        <MoreVertical aria-hidden="true" size={20} />
      </div>

      <div className="messenger-preview__chat">
        <span className="messenger-preview__date">HEUTE</span>
        {value.messages.length === 0 ? (
          <p className="messenger-preview__empty">
            Nachrichten erscheinen hier.
          </p>
        ) : (
          value.messages.map((message) => (
            <div
              className={`message-bubble message-bubble--${message.type}`}
              key={message.id}
            >
              <span className="message-bubble__text">
                {message.text || "Leere Nachricht"}
              </span>
              <span className="message-bubble__meta">
                {message.time}
                {message.type === "sent" && (
                  <CheckCheck aria-hidden="true" size={15} />
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
