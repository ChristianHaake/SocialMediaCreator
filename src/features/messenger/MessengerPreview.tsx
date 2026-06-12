import { ArrowLeft, CheckCheck, MoreVertical, Phone, Video } from "lucide-react";
import { forwardRef } from "react";
import type { MessengerImages, MessengerState } from "../../domain/types";
import { useTranslation } from "../../i18n";

type MessengerPreviewProps = {
  value: MessengerState;
  images: MessengerImages;
};

function initialFor(name: string) {
  return name.trim().charAt(0).toUpperCase() || "K";
}

export const MessengerPreview = forwardRef<
  HTMLDivElement,
  MessengerPreviewProps
>(function MessengerPreview({ value, images }, ref) {
  const { t } = useTranslation();
  const leftProfile = value.profiles.find((profile) => profile.side === "left")!;

  return (
    <div
      className={`messenger-preview simulation-theme theme-${value.theme}`}
      ref={ref}
    >
      <div className="messenger-preview__header">
        <ArrowLeft aria-hidden="true" size={20} />
        {images[leftProfile.id] ? (
          <img
            alt=""
            className="messenger-preview__avatar"
            src={images[leftProfile.id].url}
          />
        ) : (
          <div className="messenger-preview__avatar messenger-preview__avatar--initial">
            {initialFor(leftProfile.name)}
          </div>
        )}
        <div className="messenger-preview__identity">
          <strong>{leftProfile.name.trim() || t("messenger.contact")}</strong>
          <span>{leftProfile.status.trim() || t("messenger.lastOnline")}</span>
        </div>
        <Video aria-hidden="true" size={20} />
        <Phone aria-hidden="true" size={19} />
        <MoreVertical aria-hidden="true" size={20} />
      </div>

      <div className="messenger-preview__chat">
        <span className="messenger-preview__date">{t("messenger.today")}</span>
        {value.messages.length === 0 ? (
          <p className="messenger-preview__empty">
            {t("messenger.previewEmpty")}
          </p>
        ) : (
          value.messages.map((message) => {
            const sender = value.profiles.find(
              (profile) => profile.id === message.senderId,
            )!;
            return (
              <div
                className={`message-row message-row--${sender.side}`}
                key={message.id}
              >
                {sender.side === "left" &&
                  (images[sender.id] ? (
                    <img
                      alt=""
                      className="message-row__avatar"
                      src={images[sender.id].url}
                    />
                  ) : (
                    <span className="message-row__avatar message-row__avatar--initial">
                      {initialFor(sender.name)}
                    </span>
                  ))}
                <div
                  className={`message-bubble message-bubble--${sender.side}`}
                >
                  <strong className="message-bubble__sender">
                    {sender.name || t("messenger.profile")}
                  </strong>
                  <span className="message-bubble__text">
                    {message.text || t("messenger.emptyMessage")}
                  </span>
                  <span className="message-bubble__meta">
                    {message.timestamp}
                    {message.seen && (
                      <>
                        <CheckCheck aria-hidden="true" size={15} />
                        <span className="visually-hidden">{t("messenger.seen")}</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});
