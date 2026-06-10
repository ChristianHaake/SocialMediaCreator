import { Bookmark, Heart, Image, MessageCircle, Send } from "lucide-react";
import { forwardRef } from "react";
import type { ImageState, PhotoPostState } from "../types";

type PhotoPostPreviewProps = {
  value: PhotoPostState;
  profileImage: ImageState | null;
  postImage: ImageState | null;
};

function initialFor(username: string) {
  return username.trim().charAt(0).toUpperCase() || "M";
}

export const PhotoPostPreview = forwardRef<
  HTMLDivElement,
  PhotoPostPreviewProps
>(function PhotoPostPreview({ value, profileImage, postImage }, ref) {
  const username = value.username.trim() || "benutzername";

  return (
    <div className="photo-post" ref={ref}>
      <div className="photo-post__header">
        {profileImage ? (
          <img
            alt=""
            className="photo-post__avatar"
            src={profileImage.url}
          />
        ) : (
          <div className="photo-post__avatar photo-post__avatar--initial">
            {initialFor(username)}
          </div>
        )}
        <div className="photo-post__identity">
          <strong>{username}</strong>
          {value.showLocation && value.location.trim() && (
            <span>{value.location}</span>
          )}
        </div>
        <span aria-hidden="true" className="photo-post__more">
          ···
        </span>
      </div>

      <div className="photo-post__media">
        {postImage ? (
          <img alt={value.imageAlt} src={postImage.url} />
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
          {value.likes.toLocaleString("de-DE")} Likes
        </strong>
        <p className="photo-post__caption">
          <strong>{username}</strong> {value.caption}
        </p>
        {value.showComments && (
          <p className="photo-post__comments">
            {value.comments} Kommentare ansehen
          </p>
        )}
        <span className="photo-post__date">VOR EINEM MOMENT</span>
      </div>
    </div>
  );
});
