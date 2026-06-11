import { Bookmark, Heart, Image, MessageCircle, Send } from "lucide-react";
import { forwardRef } from "react";
import type { PhotoPostImages, PhotoPostState } from "../types";

type PhotoPostPreviewProps = {
  value: PhotoPostState;
  images: PhotoPostImages;
};

function initialFor(username: string) {
  return username.trim().charAt(0).toUpperCase() || "M";
}

export const PhotoPostPreview = forwardRef<
  HTMLDivElement,
  PhotoPostPreviewProps
>(function PhotoPostPreview({ value, images }, ref) {
  return (
    <div className="photo-feed" ref={ref}>
      {value.posts.map((post) => {
        const username = post.username.trim() || "benutzername";
        const postImages = images[post.id];
        const visibleCommentCount = Math.max(
          post.commentCount,
          post.comments.length,
        );

        return (
          <article className="photo-post" key={post.id}>
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

            <div className="photo-post__media">
              {postImages?.postImage ? (
                <img alt={post.imageAlt} src={postImages.postImage.url} />
              ) : (
                <div className="photo-post__placeholder">
                  <Image aria-hidden="true" size={52} strokeWidth={1.4} />
                  <span>Dein Bild erscheint hier</span>
                </div>
              )}
            </div>

            <div className="photo-post__content">
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
              {post.showComments && (
                <>
                  {post.comments.length > 0 && (
                    <div className="photo-post__comment-list">
                      {post.comments.map((comment) => (
                        <p key={comment.id}>
                          <strong>{comment.author || "account"}</strong>{" "}
                          {comment.text}
                        </p>
                      ))}
                    </div>
                  )}
                  {visibleCommentCount > 0 && (
                    <p className="photo-post__comments">
                      {visibleCommentCount} Kommentare ansehen
                    </p>
                  )}
                </>
              )}
              <span className="photo-post__date">VOR EINEM MOMENT</span>
            </div>
          </article>
        );
      })}
    </div>
  );
});
