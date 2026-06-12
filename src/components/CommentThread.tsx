import type { ImageState, PostComment } from "../types";
import { useTranslation } from "../i18n";

type CommentThreadProps = {
  comments: PostComment[];
  images: Record<string, ImageState>;
  variant: "photo" | "microblog";
};

function initialFor(author: string) {
  return author.trim().charAt(0).toUpperCase() || "A";
}

export function CommentThread({
  comments,
  images,
  variant,
}: CommentThreadProps) {
  const { locale } = useTranslation();
  const fallback = locale === "de" ? "account" : "account";
  return (
    <div className={`comment-thread comment-thread--${variant}`}>
      {comments.map((comment) => (
        <div className="comment-thread__group" key={comment.id}>
          <div className="comment-thread__item">
            {images[comment.id] ? (
              <img alt="" src={images[comment.id].url} />
            ) : (
              <span className="comment-thread__initial">
                {initialFor(comment.author)}
              </span>
            )}
            <div>
              <p>
                <strong>{comment.author || fallback}</strong> {comment.text}
              </p>
              {comment.timestamp && <small>{comment.timestamp}</small>}
            </div>
          </div>
          {comment.replies.map((reply) => (
            <div
              className="comment-thread__item comment-thread__item--reply"
              key={reply.id}
            >
              {images[reply.id] ? (
                <img alt="" src={images[reply.id].url} />
              ) : (
                <span className="comment-thread__initial">
                  {initialFor(reply.author)}
                </span>
              )}
              <div>
                <p>
                  <strong>{reply.author || fallback}</strong> {reply.text}
                </p>
                {reply.timestamp && <small>{reply.timestamp}</small>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
