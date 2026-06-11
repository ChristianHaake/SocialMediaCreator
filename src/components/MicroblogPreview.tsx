import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share,
} from "lucide-react";
import { forwardRef } from "react";
import type { MicroblogImages, MicroblogState } from "../types";

type MicroblogPreviewProps = {
  value: MicroblogState;
  images: MicroblogImages;
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
>(function MicroblogPreview({ value, images }, ref) {
  return (
    <div className="microblog-feed" ref={ref}>
      {value.posts.map((post) => {
        const displayName = post.displayName.trim() || "Anzeigename";
        const meta = [
          post.showTime && post.time ? post.time : null,
          post.showDate && post.date ? formatDate(post.date) : null,
        ].filter(Boolean);

        return (
          <article className="microblog-preview" key={post.id}>
            <div className="microblog-preview__header">
              {images[post.id] ? (
                <img
                  alt=""
                  className="microblog-preview__avatar"
                  src={images[post.id]?.url}
                />
              ) : (
                <div className="microblog-preview__avatar microblog-preview__avatar--initial">
                  {initialFor(displayName)}
                </div>
              )}
              <div className="microblog-preview__identity">
                <strong>{displayName}</strong>
                <span>{formatHandle(post.handle)}</span>
              </div>
              <MoreHorizontal aria-hidden="true" size={21} />
            </div>

            <p className="microblog-preview__text">
              {post.text || "Dein Beitrag erscheint hier."}
            </p>

            {meta.length > 0 && (
              <p className="microblog-preview__meta">{meta.join(" · ")}</p>
            )}

            <div className="microblog-preview__actions" aria-label="Reaktionen">
              <span>
                <MessageCircle aria-hidden="true" size={19} />
                {post.replies.toLocaleString("de-DE")}
              </span>
              <span>
                <Repeat2 aria-hidden="true" size={20} />
                {post.reposts.toLocaleString("de-DE")}
              </span>
              <span>
                <Heart aria-hidden="true" size={19} />
                {post.likes.toLocaleString("de-DE")}
              </span>
              <span aria-label="Teilen">
                <Share aria-hidden="true" size={18} />
              </span>
            </div>

            {post.comments.length > 0 && (
              <div className="microblog-preview__comments">
                {post.comments.map((comment) => (
                  <div className="microblog-comment" key={comment.id}>
                    <strong>{comment.author || "account"}</strong>
                    <p>{comment.text}</p>
                  </div>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
});
