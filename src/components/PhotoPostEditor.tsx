import { Plus, Trash2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { fieldLimits } from "../constraints";
import type {
  ImageState,
  PhotoPost,
  PhotoPostImages,
  PhotoPostState,
  PostComment,
} from "../types";
import { createId } from "../utils/ids";
import { ImageUploadField } from "./ImageUploadField";

type PhotoPostEditorProps = {
  value: PhotoPostState;
  onChange: Dispatch<SetStateAction<PhotoPostState>>;
  images: PhotoPostImages;
  onProfileImageChange: (postId: string, image: ImageState | null) => void;
  onPostImageChange: (postId: string, image: ImageState | null) => void;
  onPostRemoved: (postId: string) => void;
  onImageError: (message: string | null) => void;
};

function createPhotoPost(): PhotoPost {
  const id = createId("photo-post");
  return {
    id,
    username: "neuer_account",
    location: "",
    caption: "Neuer Beitrag",
    imageAlt: "",
    likes: 0,
    commentCount: 0,
    showLocation: false,
    showComments: true,
    comments: [],
  };
}

export function PhotoPostEditor({
  value,
  onChange,
  images,
  onProfileImageChange,
  onPostImageChange,
  onPostRemoved,
  onImageError,
}: PhotoPostEditorProps) {
  const activePost =
    value.posts.find((post) => post.id === value.activePostId) ?? value.posts[0];
  const activeImages = images[activePost.id] ?? {
    profileImage: null,
    postImage: null,
  };

  function updatePost(changes: Partial<Omit<PhotoPost, "id">>) {
    onChange((current) => ({
      ...current,
      posts: current.posts.map((post) =>
        post.id === current.activePostId ? { ...post, ...changes } : post,
      ),
    }));
  }

  function addPost() {
    const post = createPhotoPost();
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
      id: createId("photo-comment"),
      author: "account",
      text: "Neuer Kommentar",
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
                <span>{post.caption || "Ohne Beschreibung"}</span>
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
            <p>Absender und Kontext des ausgewählten Beitrags</p>
          </div>
        </div>

        <ImageUploadField
          id="profile-image"
          image={activeImages.profileImage}
          label="Profilbild"
          onChange={(image) => onProfileImageChange(activePost.id, image)}
          onError={onImageError}
        />

        <label className="field">
          <span className="field-label">Benutzername</span>
          <input
            maxLength={fieldLimits.photoPost.username}
            onChange={(event) => updatePost({ username: event.target.value })}
            value={activePost.username}
          />
        </label>

        <label className="field">
          <span className="field-label">Ort</span>
          <input
            maxLength={fieldLimits.photoPost.location}
            onChange={(event) => updatePost({ location: event.target.value })}
            value={activePost.location}
          />
        </label>

        <label className="toggle-field">
          <input
            checked={activePost.showLocation}
            onChange={(event) =>
              updatePost({ showLocation: event.target.checked })
            }
            type="checkbox"
          />
          <span>Ort in der Vorschau anzeigen</span>
        </label>
      </section>

      <section className="editor-section">
        <div className="section-heading">
          <span>03</span>
          <div>
            <h2>Inhalt</h2>
            <p>Bild und Beschreibung des ausgewählten Beitrags</p>
          </div>
        </div>

        <ImageUploadField
          id="post-image"
          image={activeImages.postImage}
          label="Beitragsbild"
          onChange={(image) => onPostImageChange(activePost.id, image)}
          onError={onImageError}
        />

        <label className="field">
          <span className="field-label">Beschreibung</span>
          <textarea
            aria-label="Beschreibung"
            maxLength={fieldLimits.photoPost.caption}
            onChange={(event) => updatePost({ caption: event.target.value })}
            rows={4}
            value={activePost.caption}
          />
          <span className="field-hint">
            {activePost.caption.length} / {fieldLimits.photoPost.caption} Zeichen
          </span>
        </label>

        <label className="field">
          <span className="field-label">Alternativtext</span>
          <input
            maxLength={fieldLimits.photoPost.imageAlt}
            onChange={(event) => updatePost({ imageAlt: event.target.value })}
            placeholder="Was ist auf dem Bild zu sehen?"
            value={activePost.imageAlt}
          />
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

        <div className="field-row">
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
          <label className="field">
            <span className="field-label">Kommentaranzahl</span>
            <input
              min={0}
              onChange={(event) =>
                updatePost({
                  commentCount: Math.max(0, Number(event.target.value)),
                })
              }
              type="number"
              value={activePost.commentCount}
            />
          </label>
        </div>

        <label className="toggle-field">
          <input
            checked={activePost.showComments}
            onChange={(event) =>
              updatePost({ showComments: event.target.checked })
            }
            type="checkbox"
          />
          <span>Kommentare anzeigen</span>
        </label>
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
