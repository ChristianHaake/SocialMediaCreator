import {
  Bookmark,
  Heart,
  Image,
  MessageCircle,
  Play,
  Send,
} from "lucide-react";
import { forwardRef, type KeyboardEvent } from "react";
import type { PhotoPostImages, PhotoPostState } from "../../domain/types";
import { formatTimelineDate, sortTimelinePosts } from "../../shared/lib/timeline";
import { CommentThread } from "../../shared/components/CommentThread";
import { useTranslation } from "../../i18n";

type PhotoPostPreviewProps = {
  value: PhotoPostState;
  images: PhotoPostImages;
  onActiveMediaChange: (postId: string, mediaId: string) => void;
  onPostSelect: (postId: string) => void;
};

function initialFor(username: string) {
  return username.trim().charAt(0).toUpperCase() || "M";
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

export const PhotoPostPreview = forwardRef<
  HTMLDivElement,
  PhotoPostPreviewProps
>(function PhotoPostPreview(
  { value, images, onActiveMediaChange, onPostSelect },
  ref,
) {
  const { locale, numberLocale, t } = useTranslation();
  return (
    <div className={`photo-feed simulation-theme theme-${value.theme}`} ref={ref}>
      {sortTimelinePosts(value.posts, value.sortOrder).map((post) => {
        const username = post.username.trim() || (locale === "de" ? "benutzername" : "username");
        const postImages = images[post.id];
        const selected = post.id === value.activePostId;
        const visibleCommentCount = Math.max(
          post.commentCount,
          post.comments.length,
        );

        return (
          <article
            className={[
              "photo-post",
              post.viewMode === "comments" ? "photo-post--comments" : "",
              selected ? "photo-post--selected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={t("post.select", {
              author: username,
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
            <div className="photo-post__header">
              {postImages?.profileImage ? (
                <img
                  alt=""
                  className="photo-post__avatar"
                  src={postImages.profileImage.url}
                />
              ) : (
                <div className="photo-post__avatar photo-post__avatar--initial">
                  {initialFor(username)}
                </div>
              )}
              <div className="photo-post__identity">
                <strong>{username}</strong>
                {post.showLocation && post.location.trim() && (
                  <span>{post.location}</span>
                )}
              </div>
              <span aria-hidden="true" className="photo-post__more">
                ···
              </span>
            </div>

            <div className="photo-post__media-list">
              {post.media.map((media, index) => (
                <div
                  className={
                    media.id === post.activeMediaId
                      ? "photo-post__media photo-post__media--active"
                      : "photo-post__media"
                  }
                  data-carousel-index={index + 1}
                  key={media.id}
                >
                  {postImages?.media[media.id] ? (
                    <img
                      alt={media.imageAlt}
                      src={postImages.media[media.id].url}
                    />
                  ) : (
                    <div className="photo-post__placeholder">
                      <Image aria-hidden="true" size={52} strokeWidth={1.4} />
                      <span>{t("photo.placeholder")}</span>
                    </div>
                  )}
                  {media.mode === "video" && (
                    <>
                      <span className="video-overlay">
                        <Play aria-hidden="true" fill="currentColor" size={34} />
                      </span>
                      {(media.videoViews || media.videoDuration) && (
                        <span className="video-meta">
                          {media.videoViews &&
                            t("photo.viewsLabel", { count: media.videoViews })}
                          {media.videoViews && media.videoDuration && " · "}
                          {media.videoDuration}
                        </span>
                      )}
                    </>
                  )}
                  {post.media.length > 1 && (
                    <span className="carousel-counter">
                      {index + 1}/{post.media.length}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {post.media.length > 1 && (
              <div
                aria-label={t("photo.carouselSelect")}
                className="carousel-dots"
              >
                {post.media.map((media, index) => (
                  <button
                    aria-label={t("photo.showImage", { index: index + 1 })}
                    aria-pressed={media.id === post.activeMediaId}
                    key={media.id}
                    onClick={() => onActiveMediaChange(post.id, media.id)}
                    type="button"
                  />
                ))}
              </div>
            )}

            <div className="photo-post__content">
              {post.viewMode === "post" && (
                <>
                  <div aria-hidden="true" className="photo-post__icons">
                    <Heart />
                    <MessageCircle />
                    <Send />
                    <Bookmark className="photo-post__bookmark" />
                  </div>
                  <strong className="photo-post__likes">
                    {t("photo.likes", {
                      count: post.likes.toLocaleString(numberLocale),
                    })}
                  </strong>
                  <p className="photo-post__caption">
                    <strong>{username}</strong> {post.caption}
                  </p>
                </>
              )}

              {post.showComments && post.comments.length > 0 && (
                <CommentThread
                  comments={post.comments}
                  images={postImages?.commentImages ?? {}}
                  variant="photo"
                />
              )}
              {post.viewMode === "post" &&
                post.showComments &&
                visibleCommentCount > 0 && (
                  <p className="photo-post__comments">
                    {t("photo.viewComments", { count: visibleCommentCount })}
                  </p>
                )}
              <span className="photo-post__date">
                {formatTimelineDate(post.date, post.time, locale)}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
});
