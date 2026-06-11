import { Plus, Trash2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { fieldLimits } from "../constraints";
import type {
  ImageState,
  MicroblogImages,
  MicroblogPost,
  MicroblogState,
  PostComment,
} from "../types";
import { createId } from "../utils/ids";
import { ImageUploadField } from "./ImageUploadField";

type MicroblogEditorProps = {
  value: MicroblogState;
  onChange: Dispatch<SetStateAction<MicroblogState>>;
  images: MicroblogImages;
  onProfileImageChange: (postId: string, image: ImageState | null) => void;
  onPostRemoved: (postId: string) => void;
  onImageError: (message: string | null) => void;
};

function createMicroblogPost(): MicroblogPost {
  const id = createId("microblog-post");
  return {
    id,
    displayName: "Neues Profil",
    handle: "neues_profil",
    text: "Neuer Beitrag",
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    showDate: true,
    showTime: true,
    replies: 0,
    reposts: 0,
    likes: 0,
    comments: [],
  };
}

export function MicroblogEditor({
  value,
  onChange,
  images,
  onProfileImageChange,
  onPostRemoved,
  onImageError,
}: MicroblogEditorProps) {
  const activePost =
    value.posts.find((post) => post.id === value.activePostId) ?? value.posts[0];

  function updatePost(changes: Partial<Omit<MicroblogPost, "id">>) {
    onChange((current) => ({
      ...current,
      posts: current.posts.map((post) =>
        post.id === current.activePostId ? { ...post, ...changes } : post,
      ),
    }));
  }

  function addPost() {
    const post = createMicroblogPost();
    onChange((current) => ({
      activePostId: post.id,
      posts: [...current.posts, post],
    }));
  }

  function removePost(id: string) {
    if (value.posts.length === 1) return;

    onChange((current) => {
      const index = current.posts.findIndex((post) => post.id === id);
      const posts = current.posts.filter((post) => post.id !== id);
      const nextActive =
        current.activePostId === id
          ? posts[Math.min(index, posts.length - 1)].id
          : current.activePostId;
      return { activePostId: nextActive, posts };
    });
    onPostRemoved(id);
  }

  function addComment() {
    const comment: PostComment = {
      id: createId("microblog-comment"),
      author: "account",
      text: "Neue Antwort",
    };
    updatePost({ comments: [...activePost.comments, comment] });
  }

  function updateComment(id: string, changes: Partial<Omit<PostComment, "id">>) {
    updatePost({
      comments: activePost.comments.map((comment) =>
        comment.id === id ? { ...comment, ...changes } : comment,
      ),
    });
  }

  function removeComment(id: string) {
    updatePost({
      comments: activePost.comments.filter((comment) => comment.id !== id),
    });
  }

  return (
    <form className="editor-form" onSubmit={(event) => event.preventDefault()}>
      <section className="editor-section">
        <div className="section-heading section-heading--actions">
          <span>01</span>
          <div>
            <h2>Beiträge</h2>
            <p>
              {value.posts.length}{" "}
              {value.posts.length === 1 ? "Beitrag" : "Beiträge"} in Reihenfolge
            </p>
          </div>
          <button
            className="button button--secondary section-heading__button"
            disabled={value.posts.length >= fieldLimits.common.posts}
            onClick={addPost}
            type="button"
          >
            <Plus aria-hidden="true" size={17} />
            Beitrag
          </button>
        </div>

        <ol className="post-selector-list">
          {value.posts.map((post, index) => (
            <li
              className={
                post.id === activePost.id
                  ? "post-selector post-selector--active"
                  : "post-selector"
              }
              key={post.id}
            >
              <button
                aria-label={`Beitrag ${index + 1} auswählen`}
                className="post-selector__select"
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    activePostId: post.id,
                  }))
                }
                type="button"
              >
                <strong>Beitrag {index + 1}</strong>
                <span>{post.text || "Ohne Text"}</span>
              </button>
              <button
                aria-label={`Beitrag ${index + 1} löschen`}
                className="compact-icon-button compact-icon-button--danger"
                disabled={value.posts.length === 1}
                onClick={() => removePost(post.id)}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="editor-section">
        <div className="section-heading">
          <span>02</span>
          <div>
            <h2>Profil</h2>
            <p>Absender des ausgewählten Beitrags</p>
          </div>
        </div>

        <ImageUploadField
          id="microblog-profile-image"
          image={images[activePost.id] ?? null}
          label="Profilbild"
          onChange={(image) => onProfileImageChange(activePost.id, image)}
          onError={onImageError}
        />

        <label className="field">
          <span className="field-label">Anzeigename</span>
          <input
            maxLength={fieldLimits.microblog.displayName}
            onChange={(event) => updatePost({ displayName: event.target.value })}
            value={activePost.displayName}
          />
        </label>

        <label className="field">
          <span className="field-label">Handle</span>
          <input
            maxLength={fieldLimits.microblog.handle}
            onChange={(event) => updatePost({ handle: event.target.value })}
            value={activePost.handle}
          />
          <span className="field-hint">
            Das @-Zeichen wird in der Vorschau automatisch ergänzt.
          </span>
        </label>
      </section>

      <section className="editor-section">
        <div className="section-heading">
          <span>03</span>
          <div>
            <h2>Inhalt</h2>
            <p>Text und optionale Zeitangaben</p>
          </div>
        </div>

        <label className="field">
          <span className="field-label">Beitragstext</span>
          <textarea
            aria-label="Beitragstext"
            onChange={(event) => updatePost({ text: event.target.value })}
            rows={6}
            value={activePost.text}
          />
          <span
            className={
              activePost.text.length > 280
                ? "field-hint field-hint--warning"
                : "field-hint"
            }
          >
            {activePost.text.length} Zeichen
            {activePost.text.length > 280
              ? " · länger als 280 Zeichen"
              : ""}
          </span>
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Datum</span>
            <input
              onChange={(event) => updatePost({ date: event.target.value })}
              type="date"
              value={activePost.date}
            />
          </label>
          <label className="field">
            <span className="field-label">Uhrzeit</span>
            <input
              onChange={(event) => updatePost({ time: event.target.value })}
              type="time"
              value={activePost.time}
            />
          </label>
        </div>

        <label className="toggle-field">
          <input
            checked={activePost.showDate}
            onChange={(event) =>
              updatePost({ showDate: event.target.checked })
            }
            type="checkbox"
          />
          <span>Datum anzeigen</span>
        </label>
        <label className="toggle-field">
          <input
            checked={activePost.showTime}
            onChange={(event) =>
              updatePost({ showTime: event.target.checked })
            }
            type="checkbox"
          />
          <span>Uhrzeit anzeigen</span>
        </label>
      </section>

      <section className="editor-section">
        <div className="section-heading">
          <span>04</span>
          <div>
            <h2>Reaktionen</h2>
            <p>Fiktive Kennzahlen des ausgewählten Beitrags</p>
          </div>
        </div>

        <div className="field-row field-row--three">
          <label className="field">
            <span className="field-label">Antworten</span>
            <input
              min={0}
              onChange={(event) =>
                updatePost({
                  replies: Math.max(0, Number(event.target.value)),
                })
              }
              type="number"
              value={activePost.replies}
            />
          </label>
          <label className="field">
            <span className="field-label">Reposts</span>
            <input
              min={0}
              onChange={(event) =>
                updatePost({
                  reposts: Math.max(0, Number(event.target.value)),
                })
              }
              type="number"
              value={activePost.reposts}
            />
          </label>
          <label className="field">
            <span className="field-label">Likes</span>
            <input
              min={0}
              onChange={(event) =>
                updatePost({ likes: Math.max(0, Number(event.target.value)) })
              }
              type="number"
              value={activePost.likes}
            />
          </label>
        </div>
      </section>

      <section className="editor-section">
        <div className="section-heading section-heading--actions">
          <span>05</span>
          <div>
            <h2>Kommentare</h2>
            <p>
              {activePost.comments.length}{" "}
              {activePost.comments.length === 1
                ? "angehängter Kommentar"
                : "angehängte Kommentare"}
            </p>
          </div>
          <button
            className="button button--secondary section-heading__button"
            disabled={
              activePost.comments.length >= fieldLimits.common.comments
            }
            onClick={addComment}
            type="button"
          >
            <Plus aria-hidden="true" size={17} />
            Kommentar
          </button>
        </div>

        {activePost.comments.length === 0 ? (
          <p className="empty-state">Noch keine Kommentare angehängt.</p>
        ) : (
          <ol className="message-editor-list">
            {activePost.comments.map((comment, index) => (
              <li className="message-editor-card" key={comment.id}>
                <div className="message-editor-card__header">
                  <strong>Kommentar {index + 1}</strong>
                  <button
                    aria-label={`Kommentar ${index + 1} löschen`}
                    className="compact-icon-button compact-icon-button--danger"
                    onClick={() => removeComment(comment.id)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={16} />
                  </button>
                </div>
                <label className="field">
                  <span className="field-label">Autor</span>
                  <input
                    maxLength={fieldLimits.common.commentAuthor}
                    onChange={(event) =>
                      updateComment(comment.id, {
                        author: event.target.value,
                      })
                    }
                    value={comment.author}
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
              </li>
            ))}
          </ol>
        )}
      </section>
    </form>
  );
}
