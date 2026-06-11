import { Plus, Trash2 } from "lucide-react";
import { fieldLimits } from "../constraints";
import type { ImageState, PostComment } from "../types";
import { createId } from "../utils/ids";
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
  function addComment() {
    onChange([
      ...comments,
      {
        id: createId(`${idPrefix}-comment`),
        author: "account",
        text: "Neuer Kommentar",
        timestamp: "gerade eben",
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
          text: "Neue Antwort",
          timestamp: "gerade eben",
        },
      ],
    });
  }

  return (
    <>
      <div className="comment-editor-heading">
        <p>
          {comments.length} {comments.length === 1 ? "Kommentar" : "Kommentare"}
        </p>
        <button
          className="button button--secondary"
          disabled={comments.length >= fieldLimits.common.comments}
          onClick={addComment}
          type="button"
        >
          <Plus aria-hidden="true" size={17} />
          Kommentar
        </button>
      </div>

      {comments.length === 0 ? (
        <p className="empty-state">Noch keine Kommentare angehängt.</p>
      ) : (
        <ol className="message-editor-list">
          {comments.map((comment, commentIndex) => (
            <li className="message-editor-card" key={comment.id}>
              <div className="message-editor-card__header">
                <strong>Kommentar {commentIndex + 1}</strong>
                <button
                  aria-label={`Kommentar ${commentIndex + 1} löschen`}
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
                label="Profilbild"
                onChange={(image) => onImageChange(comment.id, image)}
                onError={onImageError}
              />
              <label className="field">
                <span className="field-label">Autor</span>
                <input
                  maxLength={fieldLimits.common.commentAuthor}
                  onChange={(event) =>
                    updateComment(comment.id, { author: event.target.value })
                  }
                  value={comment.author}
                />
              </label>
              <label className="field">
                <span className="field-label">Zeitstempel</span>
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
                <span className="field-label">Kommentartext</span>
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
                  <strong>Antworten</strong>
                  <button
                    className="button button--secondary"
                    disabled={
                      comment.replies.length >= fieldLimits.common.replies
                    }
                    onClick={() => addReply(comment)}
                    type="button"
                  >
                    <Plus aria-hidden="true" size={16} />
                    Antwort
                  </button>
                </div>
                {comment.replies.map((reply, replyIndex) => (
                  <div className="reply-editor__card" key={reply.id}>
                    <div className="message-editor-card__header">
                      <strong>Antwort {replyIndex + 1}</strong>
                      <button
                        aria-label={`Antwort ${replyIndex + 1} löschen`}
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
                      label="Profilbild"
                      onChange={(image) => onImageChange(reply.id, image)}
                      onError={onImageError}
                    />
                    <label className="field">
                      <span className="field-label">Autor</span>
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
                      <span className="field-label">Zeitstempel</span>
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
                      <span className="field-label">Antworttext</span>
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
