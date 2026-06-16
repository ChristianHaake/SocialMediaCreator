import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share,
} from "lucide-react";
import { type KeyboardEvent } from "react";
import type { MicroblogImages, MicroblogState } from "../../domain/types";
import { formatTimelineDate, sortTimelinePosts } from "../../shared/lib/timeline";
import { CommentThread } from "../../shared/components/CommentThread";
import { useTranslation } from "../../i18n";

type MicroblogPreviewProps = {
  value: MicroblogState;
  images: MicroblogImages;
  onPostSelect: (postId: string) => void;
};

function initialFor(displayName: string) {
  return displayName.trim().charAt(0).toUpperCase() || "M";
}

function formatHandle(handle: string) {
  const normalized = handle.trim().replace(/^@+/, "");
  return `@${normalized || "handle"}`;
}

function handlePostKeyDown(
  event: KeyboardEvent<HTMLElement>,
  onSelect: () => void,
) {
  if (event.target !== event.currentTarget) return;
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  onSelect();
}

export function MicroblogPreview({ value, images, onPostSelect }: MicroblogPreviewProps) {
  const { locale, numberLocale, t } = useTranslation();
  const sortedPosts = sortTimelinePosts(value.posts, value.sortOrder);
  return (
    <div
      className={`microblog-feed microblog-feed--${value.layoutMode} simulation-theme theme-${value.theme}`}
    >
      {sortedPosts.map((post, index) => {
        const displayName =
          post.displayName.trim() || t("microblog.displayName");
        const postImages = images[post.id];
        const selected = post.id === value.activePostId;
        return (
          <article
            className={
              [
                "microblog-preview",
                post.viewMode === "comments"
                  ? "microblog-preview--comments"
                  : "",
                index === 0 ? "microblog-preview--first" : "",
                index === sortedPosts.length - 1
                  ? "microblog-preview--last"
                  : "",
                selected ? "microblog-preview--selected" : "",
              ]
                .filter(Boolean)
                .join(" ")
            }
            aria-label={t("post.select", {
              author: displayName,
              date: formatTimelineDate(post.date, post.time, locale),
            })}
            aria-pressed={selected}
            key={post.id}
            onClick={() => onPostSelect(post.id)}
            onKeyDown={(event) =>
              handlePostKeyDown(event, () => onPostSelect(post.id))
            }
            role="button"
            tabIndex={0}
          >
            <div className="microblog-preview__header">
              {postImages?.profileImage ? (
                <img
                  alt=""
                  className="microblog-preview__avatar"
                  src={postImages.profileImage.url}
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

            {post.viewMode === "post" && (
              <>
                <p className="microblog-preview__text">
                  {post.text || t("microblog.placeholder")}
                </p>
                <p className="microblog-preview__meta">
                  {formatTimelineDate(post.date, post.time, locale)}
                </p>
                <div
                  className="microblog-preview__actions"
                  aria-label={t("microblog.reactions")}
                >
                  <span>
                    <MessageCircle aria-hidden="true" size={19} />
                    {post.replies.toLocaleString(numberLocale)}
                  </span>
                  <span>
                    <Repeat2 aria-hidden="true" size={20} />
                    {post.reposts.toLocaleString(numberLocale)}
                  </span>
                  <span>
                    <Heart aria-hidden="true" size={19} />
                    {post.likes.toLocaleString(numberLocale)}
                  </span>
                  <span aria-label={t("microblog.share")}>
                    <Share aria-hidden="true" size={18} />
                  </span>
                </div>
              </>
            )}

            {post.viewMode === "comments" && (
              <p className="comment-view-context">{post.text}</p>
            )}
            {post.comments.length > 0 && (
              <CommentThread
                comments={post.comments}
                images={postImages?.commentImages ?? {}}
                variant="microblog"
              />
            )}
          </article>
        );
      })}
    </div>
  );
}
