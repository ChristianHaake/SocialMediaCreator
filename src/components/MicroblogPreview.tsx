import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share,
} from "lucide-react";
import { forwardRef } from "react";
import type { ImageState, MicroblogState } from "../types";

type MicroblogPreviewProps = {
  value: MicroblogState;
  profileImage: ImageState | null;
};

function initialFor(displayName: string) {
  return displayName.trim().charAt(0).toUpperCase() || "M";
}

function formatHandle(handle: string) {
  const normalized = handle.trim().replace(/^@+/, "");
  return `@${normalized || "handle"}`;
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}.${month}.${year}` : date;
}

export const MicroblogPreview = forwardRef<
  HTMLDivElement,
  MicroblogPreviewProps
>(function MicroblogPreview({ value, profileImage }, ref) {
  const displayName = value.displayName.trim() || "Anzeigename";
  const meta = [
    value.showTime && value.time ? value.time : null,
    value.showDate && value.date ? formatDate(value.date) : null,
  ].filter(Boolean);

  return (
    <article className="microblog-preview" ref={ref}>
      <div className="microblog-preview__header">
        {profileImage ? (
          <img
            alt=""
            className="microblog-preview__avatar"
            src={profileImage.url}
          />
        ) : (
          <div className="microblog-preview__avatar microblog-preview__avatar--initial">
            {initialFor(displayName)}
          </div>
        )}
        <div className="microblog-preview__identity">
          <strong>{displayName}</strong>
          <span>{formatHandle(value.handle)}</span>
        </div>
        <MoreHorizontal aria-hidden="true" size={21} />
      </div>

      <p className="microblog-preview__text">
        {value.text || "Dein Beitrag erscheint hier."}
      </p>

      {meta.length > 0 && (
        <p className="microblog-preview__meta">{meta.join(" · ")}</p>
      )}

      <div className="microblog-preview__actions" aria-label="Reaktionen">
        <span>
          <MessageCircle aria-hidden="true" size={19} />
          {value.replies.toLocaleString("de-DE")}
        </span>
        <span>
          <Repeat2 aria-hidden="true" size={20} />
          {value.reposts.toLocaleString("de-DE")}
        </span>
        <span>
          <Heart aria-hidden="true" size={19} />
          {value.likes.toLocaleString("de-DE")}
        </span>
        <span aria-label="Teilen">
          <Share aria-hidden="true" size={18} />
        </span>
      </div>
    </article>
  );
});
