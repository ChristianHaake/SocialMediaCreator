import { Plus, Trash2 } from "lucide-react";
import { fieldLimits } from "../../domain/constraints";
import type { ImageState, PostComment } from "../../domain/types";
import { createId } from "../lib/ids";
import { useTranslation } from "../../i18n";
import { ImageUploadField } from "./ImageUploadField";

type CommentEditorProps = {
  comments: PostComment[];
  idPrefix: string;
  images: Record<string, ImageState>;
  onChange: (comments: PostComment[]) => void;
  onImageChange: (id: string, image: ImageState | null) => void;
  onImageError: (message: string | null) => void;
  onItemRemoved: (ids: string[]) => void;
};

export function CommentEditor({
  comments,
  idPrefix,
  images,
  onChange,
  onImageChange,
  onImageError,
  onItemRemoved,
}: CommentEditorProps) {
  const { t } = useTranslation();
  function addComment() {
    onChange([
      ...comments,
      {
        id: createId(`${idPrefix}-comment`),
        author: "account",
        text: t("comment.new"),
        timestamp: t("comment.justNow"),
        replies: [],
      },
    ]);
  }

  function updateComment(id: string, changes: Partial<Omit<PostComment, "id">>) {
    onChange(
      comments.map((comment) =>
        comment.id === id ? { ...comment, ...changes } : comment,
      ),
    );
  }

  function removeComment(comment: PostComment) {
    onChange(comments.filter((item) => item.id !== comment.id));
    onItemRemoved([
      comment.id,
      ...comment.replies.map((reply) => reply.id),
    ]);
  }

  function addReply(comment: PostComment) {
    updateComment(comment.id, {
      replies: [
        ...comment.replies,
        {
          id: createId(`${idPrefix}-reply`),
          author: "account",
          text: t("comment.newReply"),
          timestamp: t("comment.justNow"),
        },
      ],
    });
  }

  return (
    <>
      <div className="comment-editor-heading">
        <p>
          {t(
            comments.length === 1
              ? "comment.count.one"
              : "comment.count.other",
            { count: comments.length },
          )}
        </p>
        <button
          className="button button--secondary"
          disabled={comments.length >= fieldLimits.common.comments}
          onClick={addComment}
          type="button"
        >
          <Plus aria-hidden="true" size={17} />
          {t("common.comment")}
        </button>
      </div>

      {comments.length === 0 ? (
        <p className="empty-state">{t("comment.empty")}</p>
      ) : (
        <ol className="message-editor-list">
          {comments.map((comment, commentIndex) => (
            <li className="message-editor-card" key={comment.id}>
              <div className="message-editor-card__header">
                <strong>{t("common.comment")} {commentIndex + 1}</strong>
                <button
                  aria-label={`${t("common.comment")} ${commentIndex + 1} ${t("common.delete")}`}
                  className="compact-icon-button compact-icon-button--danger"
                  onClick={() => removeComment(comment)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={16} />
                </button>
              </div>
              <ImageUploadField
                id={`${idPrefix}-comment-image-${comment.id}`}
                image={images[comment.id] ?? null}
                label={t("common.profileImage")}
                onChange={(image) => onImageChange(comment.id, image)}
                onError={onImageError}
              />
              <label className="field">
                <span className="field-label">{t("common.author")}</span>
                <input
                  maxLength={fieldLimits.common.commentAuthor}
                  onChange={(event) =>
                    updateComment(comment.id, { author: event.target.value })
                  }
                  value={comment.author}
                />
              </label>
              <label className="field">
                <span className="field-label">{t("common.timestamp")}</span>
                <input
                  maxLength={fieldLimits.common.timestamp}
                  onChange={(event) =>
                    updateComment(comment.id, {
                      timestamp: event.target.value,
                    })
                  }
                  value={comment.timestamp}
                />
              </label>
              <label className="field">
                <span className="field-label">{t("comment.text")}</span>
                <textarea
                  maxLength={fieldLimits.common.commentText}
                  onChange={(event) =>
                    updateComment(comment.id, { text: event.target.value })
                  }
                  rows={3}
                  value={comment.text}
                />
              </label>

              <div className="reply-editor">
                <div className="comment-editor-heading">
                  <strong>{t("common.replies")}</strong>
                  <button
                    className="button button--secondary"
                    disabled={
                      comment.replies.length >= fieldLimits.common.replies
                    }
                    onClick={() => addReply(comment)}
                    type="button"
                  >
                    <Plus aria-hidden="true" size={16} />
                    {t("common.reply")}
                  </button>
                </div>
                {comment.replies.map((reply, replyIndex) => (
                  <div className="reply-editor__card" key={reply.id}>
                    <div className="message-editor-card__header">
                      <strong>{t("common.reply")} {replyIndex + 1}</strong>
                      <button
                        aria-label={`${t("common.reply")} ${replyIndex + 1} ${t("common.delete")}`}
                        className="compact-icon-button compact-icon-button--danger"
                        onClick={() => {
                          updateComment(comment.id, {
                            replies: comment.replies.filter(
                              (item) => item.id !== reply.id,
                            ),
                          });
                          onItemRemoved([reply.id]);
                        }}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={15} />
                      </button>
                    </div>
                    <ImageUploadField
                      id={`${idPrefix}-reply-image-${reply.id}`}
                      image={images[reply.id] ?? null}
                      label={t("common.profileImage")}
                      onChange={(image) => onImageChange(reply.id, image)}
                      onError={onImageError}
                    />
                    <label className="field">
                      <span className="field-label">{t("common.author")}</span>
                      <input
                        maxLength={fieldLimits.common.commentAuthor}
                        onChange={(event) =>
                          updateComment(comment.id, {
                            replies: comment.replies.map((item) =>
                              item.id === reply.id
                                ? { ...item, author: event.target.value }
                                : item,
                            ),
                          })
                        }
                        value={reply.author}
                      />
                    </label>
                    <label className="field">
                      <span className="field-label">{t("common.timestamp")}</span>
                      <input
                        maxLength={fieldLimits.common.timestamp}
                        onChange={(event) =>
                          updateComment(comment.id, {
                            replies: comment.replies.map((item) =>
                              item.id === reply.id
                                ? { ...item, timestamp: event.target.value }
                                : item,
                            ),
                          })
                        }
                        value={reply.timestamp}
                      />
                    </label>
                    <label className="field">
                      <span className="field-label">{t("comment.replyText")}</span>
                      <textarea
                        maxLength={fieldLimits.common.commentText}
                        onChange={(event) =>
                          updateComment(comment.id, {
                            replies: comment.replies.map((item) =>
                              item.id === reply.id
                                ? { ...item, text: event.target.value }
                                : item,
                            ),
                          })
                        }
                        rows={2}
                        value={reply.text}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
