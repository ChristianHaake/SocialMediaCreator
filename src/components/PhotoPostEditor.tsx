import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { fieldLimits } from "../constraints";
import type {
  ImageState,
  PhotoMedia,
  PhotoPost,
  PhotoPostImages,
  PhotoPostState,
} from "../types";
import { createId } from "../utils/ids";
import {
  formatTimelineDate,
  sortTimelinePosts,
  todayInputValue,
} from "../utils/timeline";
import { CommentEditor } from "./CommentEditor";
import { EditorDisclosure } from "./EditorDisclosure";
import { ImageUploadField } from "./ImageUploadField";
import { TimelinePostList } from "./TimelinePostList";
import { ThemeSelector } from "./ThemeSelector";

type PhotoPostEditorProps = {
  value: PhotoPostState;
  onChange: Dispatch<SetStateAction<PhotoPostState>>;
  images: PhotoPostImages;
  onProfileImageChange: (postId: string, image: ImageState | null) => void;
  onMediaImageChange: (
    postId: string,
    mediaId: string,
    image: ImageState | null,
  ) => void;
  onCommentImageChange: (
    postId: string,
    itemId: string,
    image: ImageState | null,
  ) => void;
  onImagesRemoved: (postId: string, ids: string[]) => void;
  onPostRemoved: (postId: string) => void;
  onImageError: (message: string | null) => void;
};

function createMedia(): PhotoMedia {
  return {
    id: createId("photo-media"),
    imageAlt: "",
    mode: "image",
    videoDuration: "",
    videoViews: "",
  };
}

function createPhotoPost(): PhotoPost {
  const id = createId("photo-post");
  const media = createMedia();
  return {
    id,
    username: "neuer_account",
    location: "",
    caption: "Neuer Beitrag",
    date: todayInputValue(),
    time: "",
    viewMode: "post",
    likes: 0,
    commentCount: 0,
    showLocation: false,
    showComments: true,
    activeMediaId: media.id,
    media: [media],
    comments: [],
  };
}

export function PhotoPostEditor({
  value,
  onChange,
  images,
  onProfileImageChange,
  onMediaImageChange,
  onCommentImageChange,
  onImagesRemoved,
  onPostRemoved,
  onImageError,
}: PhotoPostEditorProps) {
  const activePost =
    value.posts.find((post) => post.id === value.activePostId) ?? value.posts[0];
  const activeMedia =
    activePost.media.find((media) => media.id === activePost.activeMediaId) ??
    activePost.media[0];
  const activeImages = images[activePost.id] ?? {
    profileImage: null,
    media: {},
    commentImages: {},
  };
  const sortedPosts = sortTimelinePosts(value.posts, value.sortOrder);

  function updatePost(changes: Partial<Omit<PhotoPost, "id">>) {
    onChange((current) => ({
      ...current,
      posts: current.posts.map((post) =>
        post.id === current.activePostId ? { ...post, ...changes } : post,
      ),
    }));
  }

  function updateMedia(id: string, changes: Partial<Omit<PhotoMedia, "id">>) {
    updatePost({
      media: activePost.media.map((media) =>
        media.id === id ? { ...media, ...changes } : media,
      ),
    });
  }

  function addPost() {
    const post = createPhotoPost();
    onChange((current) => ({
      ...current,
      activePostId: post.id,
      posts: [...current.posts, post],
    }));
  }

  function removePost(id: string) {
    if (value.posts.length === 1) return;
    onChange((current) => {
      const index = current.posts.findIndex((post) => post.id === id);
      const posts = current.posts.filter((post) => post.id !== id);
      return {
        ...current,
        activePostId:
          current.activePostId === id
            ? posts[Math.min(index, posts.length - 1)].id
            : current.activePostId,
        posts,
      };
    });
    onPostRemoved(id);
  }

  function addMedia() {
    if (activePost.media.length >= fieldLimits.photoPost.media) return;
    const media = createMedia();
    updatePost({
      activeMediaId: media.id,
      media: [...activePost.media, media],
    });
  }

  function removeMedia(id: string) {
    if (activePost.media.length === 1) return;
    const index = activePost.media.findIndex((media) => media.id === id);
    const media = activePost.media.filter((item) => item.id !== id);
    updatePost({
      activeMediaId:
        activePost.activeMediaId === id
          ? media[Math.min(index, media.length - 1)].id
          : activePost.activeMediaId,
      media,
    });
    onImagesRemoved(activePost.id, [id]);
  }

  function moveMedia(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= activePost.media.length) return;
    const media = [...activePost.media];
    [media[index], media[target]] = [media[target], media[index]];
    updatePost({ media });
  }

  return (
    <form className="editor-form" onSubmit={(event) => event.preventDefault()}>
      <EditorDisclosure
        description="Farbschema und Reihenfolge der Timeline"
        number="01"
        title="Darstellung"
      >
        <ThemeSelector
          onChange={(theme) => onChange((current) => ({ ...current, theme }))}
          value={value.theme}
        />
        <label className="field">
          <span className="field-label">Timeline-Reihenfolge</span>
          <select
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                sortOrder: event.target.value as PhotoPostState["sortOrder"],
              }))
            }
            value={value.sortOrder}
          >
            <option value="newest">Neueste zuerst</option>
            <option value="oldest">Älteste zuerst</option>
          </select>
        </label>
      </EditorDisclosure>

      <EditorDisclosure
        defaultOpen
        description={`${value.posts.length} ${
          value.posts.length === 1 ? "Beitrag" : "Beiträge"
        }, automatisch chronologisch sortiert`}
        number="02"
        title="Beiträge"
      >
        <div className="editor-section-actions">
          <button
            className="button button--secondary"
            disabled={value.posts.length >= fieldLimits.common.posts}
            onClick={addPost}
            type="button"
          >
            <Plus aria-hidden="true" size={17} />
            Beitrag
          </button>
        </div>
        <TimelinePostList
          activeId={activePost.id}
          onRemove={removePost}
          onSelect={(activePostId) =>
            onChange((current) => ({ ...current, activePostId }))
          }
          posts={sortedPosts.map((post) => ({
            id: post.id,
            summary: post.caption || "Ohne Beschreibung",
            timestamp: formatTimelineDate(post.date, post.time),
          }))}
        />
      </EditorDisclosure>

      <EditorDisclosure
        defaultOpen
        description="Absender, Veröffentlichungszeitpunkt und Fokus"
        number="03"
        title="Profil und Ansicht"
      >
        <ImageUploadField
          id="profile-image"
          image={activeImages.profileImage}
          label="Profilbild"
          onChange={(image) => onProfileImageChange(activePost.id, image)}
          onError={onImageError}
        />
        <div className="field-row">
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
        </div>
        <div className="field-row">
          <label className="field">
            <span className="field-label">Datum</span>
            <input
              onChange={(event) => {
                if (event.target.value) updatePost({ date: event.target.value });
              }}
              required
              type="date"
              value={activePost.date}
            />
          </label>
          <label className="field">
            <span className="field-label">Uhrzeit (optional)</span>
            <input
              onChange={(event) => updatePost({ time: event.target.value })}
              type="time"
              value={activePost.time}
            />
          </label>
        </div>
        <label className="field">
          <span className="field-label">Darstellungsmodus</span>
          <select
            onChange={(event) =>
              updatePost({
                viewMode: event.target.value as PhotoPost["viewMode"],
              })
            }
            value={activePost.viewMode}
          >
            <option value="post">Vollständiger Beitrag</option>
            <option value="comments">Kommentaransicht</option>
          </select>
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
      </EditorDisclosure>

      <EditorDisclosure
        description="Bis zu zehn Bilder oder Video-Thumbnails"
        number="04"
        title="Karussell"
      >
        <div className="editor-section-actions">
          <button
            className="button button--secondary"
            disabled={activePost.media.length >= fieldLimits.photoPost.media}
            onClick={addMedia}
            type="button"
          >
            <Plus aria-hidden="true" size={17} />
            Medium
          </button>
        </div>
        <ol className="media-editor-list">
          {activePost.media.map((media, index) => (
            <li
              className={
                media.id === activeMedia.id
                  ? "post-selector post-selector--active"
                  : "post-selector"
              }
              key={media.id}
            >
              <button
                aria-label={`Medium ${index + 1} auswählen`}
                className="post-selector__select"
                onClick={() => updatePost({ activeMediaId: media.id })}
                type="button"
              >
                <strong>Medium {index + 1}</strong>
                <span>{media.mode === "video" ? "Video" : "Bild"}</span>
              </button>
              <div className="message-editor-card__actions">
                <button
                  aria-label={`Medium ${index + 1} nach oben verschieben`}
                  className="compact-icon-button"
                  disabled={index === 0}
                  onClick={() => moveMedia(index, -1)}
                  type="button"
                >
                  <ArrowUp aria-hidden="true" size={15} />
                </button>
                <button
                  aria-label={`Medium ${index + 1} nach unten verschieben`}
                  className="compact-icon-button"
                  disabled={index === activePost.media.length - 1}
                  onClick={() => moveMedia(index, 1)}
                  type="button"
                >
                  <ArrowDown aria-hidden="true" size={15} />
                </button>
                <button
                  aria-label={`Medium ${index + 1} löschen`}
                  className="compact-icon-button compact-icon-button--danger"
                  disabled={activePost.media.length === 1}
                  onClick={() => removeMedia(media.id)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={15} />
                </button>
              </div>
            </li>
          ))}
        </ol>

        <ImageUploadField
          id="post-image"
          image={activeImages.media[activeMedia.id] ?? null}
          label={`Datei für Medium ${activePost.media.indexOf(activeMedia) + 1}`}
          onChange={(image) =>
            onMediaImageChange(activePost.id, activeMedia.id, image)
          }
          onError={onImageError}
        />
        <label className="field">
          <span className="field-label">Medientyp</span>
          <select
            onChange={(event) =>
              updateMedia(activeMedia.id, {
                mode: event.target.value as PhotoMedia["mode"],
              })
            }
            value={activeMedia.mode}
          >
            <option value="image">Bild</option>
            <option value="video">Video-Simulation</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Alternativtext</span>
          <input
            maxLength={fieldLimits.photoPost.imageAlt}
            onChange={(event) =>
              updateMedia(activeMedia.id, { imageAlt: event.target.value })
            }
            placeholder="Was ist auf dem Bild zu sehen?"
            value={activeMedia.imageAlt}
          />
        </label>
        {activeMedia.mode === "video" && (
          <div className="field-row">
            <label className="field">
              <span className="field-label">Videolänge</span>
              <input
                maxLength={fieldLimits.photoPost.videoDuration}
                onChange={(event) =>
                  updateMedia(activeMedia.id, {
                    videoDuration: event.target.value,
                  })
                }
                placeholder="z. B. 0:42"
                value={activeMedia.videoDuration}
              />
            </label>
            <label className="field">
              <span className="field-label">Aufrufe</span>
              <input
                maxLength={fieldLimits.photoPost.videoViews}
                onChange={(event) =>
                  updateMedia(activeMedia.id, {
                    videoViews: event.target.value,
                  })
                }
                placeholder="z. B. 1.240"
                value={activeMedia.videoViews}
              />
            </label>
          </div>
        )}
      </EditorDisclosure>

      <EditorDisclosure
        defaultOpen
        description="Beschreibung und fiktive Kennzahlen"
        number="05"
        title="Inhalt und Reaktionen"
      >
        <label className="field">
          <span className="field-label">Beschreibung</span>
          <textarea
            aria-label="Beschreibung"
            maxLength={fieldLimits.photoPost.caption}
            onChange={(event) => updatePost({ caption: event.target.value })}
            rows={4}
            value={activePost.caption}
          />
        </label>
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
      </EditorDisclosure>

      <EditorDisclosure
        description="Zweistufige Diskussion zum ausgewählten Beitrag"
        number="06"
        title="Kommentare und Antworten"
      >
        <CommentEditor
          comments={activePost.comments}
          idPrefix="photo"
          images={activeImages.commentImages}
          onChange={(comments) => updatePost({ comments })}
          onImageChange={(id, image) =>
            onCommentImageChange(activePost.id, id, image)
          }
          onImageError={onImageError}
          onItemRemoved={(ids) => onImagesRemoved(activePost.id, ids)}
        />
      </EditorDisclosure>
    </form>
  );
}
