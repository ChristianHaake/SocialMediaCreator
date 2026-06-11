import {
  Bookmark,
  Heart,
  Image,
  MessageCircle,
  Play,
  Send,
} from "lucide-react";
import { forwardRef } from "react";
import type { PhotoPostImages, PhotoPostState } from "../types";
import { CommentThread } from "./CommentThread";

type PhotoPostPreviewProps = {
  value: PhotoPostState;
  images: PhotoPostImages;
  onActiveMediaChange: (postId: string, mediaId: string) => void;
};

function initialFor(username: string) {
  return username.trim().charAt(0).toUpperCase() || "M";
}

export const PhotoPostPreview = forwardRef<
  HTMLDivElement,
  PhotoPostPreviewProps
>(function PhotoPostPreview(
  { value, images, onActiveMediaChange },
  ref,
) {
  return (
    <div className={`photo-feed simulation-theme theme-${value.theme}`} ref={ref}>
      {value.posts.map((post) => {
        const username = post.username.trim() || "benutzername";
        const postImages = images[post.id];
        const visibleCommentCount = Math.max(
          post.commentCount,
          post.comments.length,
        );

        return (
          <article
            className={
              post.viewMode === "comments"
                ? "photo-post photo-post--comments"
                : "photo-post"
            }
            key={post.id}
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
                      <span>Dein Bild erscheint hier</span>
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
                            `${media.videoViews} Aufrufe`}
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
                aria-label="Karussellbild auswählen"
                className="carousel-dots"
              >
                {post.media.map((media, index) => (
                  <button
                    aria-label={`Bild ${index + 1} anzeigen`}
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
                    {post.likes.toLocaleString("de-DE")} Likes
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
                    {visibleCommentCount} Kommentare ansehen
                  </p>
                )}
              {post.timestamp && (
                <span className="photo-post__date">{post.timestamp}</span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
});
