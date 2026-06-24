import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import { fieldLimits } from "../../domain/constraints";
import type {
  ImageState,
  PhotoMedia,
  PhotoPost,
  PhotoPostImages,
  PhotoPostState,
} from "../../domain/types";
import { createId } from "../../shared/lib/ids";
import { useTranslation } from "../../i18n";
import {
  formatTimelineDate,
  sortTimelinePosts,
  todayInputValue,
} from "../../shared/lib/timeline";
import { CommentEditor } from "../../shared/components/CommentEditor";
import { EmojiTextarea } from "../../shared/components/EmojiTextarea";
import { EditorDisclosure } from "../../shared/components/EditorDisclosure";
import { ImageUploadField } from "../../shared/components/ImageUploadField";
import { StructuredTimestampFields } from "../../shared/components/StructuredTimestampFields";
import { TimelinePostList } from "../../shared/components/TimelinePostList";
import { ThemeSelector } from "../../shared/components/ThemeSelector";

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

function createPhotoPost(locale: "de" | "en"): PhotoPost {
  const id = createId("photo-post");
  const media = createMedia();
  return {
    id,
    username: locale === "de" ? "neuer_account" : "new_account",
    location: "",
    caption: locale === "de" ? "Neuer Beitrag" : "New post",
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

function parseMetricInput(value: string) {
  const next = Number(value);
  if (!Number.isFinite(next)) return 0;
  return Math.min(
    fieldLimits.common.metric,
    Math.max(0, Math.floor(next)),
  );
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
  const { locale, t } = useTranslation();
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
  const sortedPosts = useMemo(
    () => sortTimelinePosts(value.posts, value.sortOrder),
    [value.posts, value.sortOrder],
  );
  const detailRef = useRef<HTMLElement>(null);
  const authorInputRef = useRef<HTMLInputElement>(null);
  const previousActivePostId = useRef(activePost.id);
  const focusNewPost = useRef(false);
  const activePosition =
    sortedPosts.findIndex((post) => post.id === activePost.id) + 1;

  useEffect(() => {
    if (previousActivePostId.current === activePost.id) return;
    previousActivePostId.current = activePost.id;
    detailRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    if (focusNewPost.current) {
      focusNewPost.current = false;
      window.setTimeout(() => authorInputRef.current?.focus(), 0);
    }
  }, [activePost.id]);

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
    const post = createPhotoPost(locale);
    focusNewPost.current = true;
    onChange((current) => ({
      ...current,
      activePostId: post.id,
      posts: [...current.posts, post],
    }));
  }

  function removePost(id: string) {
    if (value.posts.length === 1) return;
    const post = value.posts.find((item) => item.id === id);
    if (
      !post ||
      !window.confirm(
        t("post.deleteConfirm", {
          author: post.username || t("photo.username"),
          date: formatTimelineDate(post.date, post.time, locale),
        }),
      )
    ) {
      return;
    }
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
      <section className="editor-master-section">
        <header className="editor-master-section__header">
          <h3>{t("project.settings")}</h3>
          <p>{t("project.settingsDescription")}</p>
        </header>
        <div className="editor-master-section__content">
          <ThemeSelector
            onChange={(theme) => onChange((current) => ({ ...current, theme }))}
            value={value.theme}
          />
          <label className="field">
            <span className="field-label">{t("common.timelineOrder")}</span>
            <select
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  sortOrder: event.target.value as PhotoPostState["sortOrder"],
                }))
              }
              value={value.sortOrder}
            >
              <option value="newest">{t("common.newest")}</option>
              <option value="oldest">{t("common.oldest")}</option>
            </select>
          </label>
        </div>
      </section>

      <section className="post-management">
        <header className="post-management__header">
          <div>
            <h3>{t("post.manage")}</h3>
            <p>
              {t(
                value.posts.length === 1
                  ? "photo.postsDescription.one"
                  : "photo.postsDescription.other",
                { count: value.posts.length },
              )}
            </p>
          </div>
          <button
            className="button button--primary"
            disabled={value.posts.length >= fieldLimits.common.posts}
            onClick={addPost}
            type="button"
          >
            <Plus aria-hidden="true" size={17} />
            {t("post.add")}
          </button>
        </header>
        <TimelinePostList
          activeId={activePost.id}
          onRemove={removePost}
          onSelect={(activePostId) =>
            onChange((current) => ({ ...current, activePostId }))
          }
          posts={sortedPosts.map((post) => ({
            author: post.username || t("photo.username"),
            id: post.id,
            summary: post.caption || t("photo.noDescription"),
            timestamp: formatTimelineDate(post.date, post.time, locale),
          }))}
        />
      </section>

      <section className="active-post-editor" ref={detailRef}>
        <header className="active-post-editor__header">
          <div>
            <h3>{t("post.editSelected")}</h3>
            <p>{t("post.editDescription")}</p>
          </div>
          <div className="active-post-editor__context">
            <strong>{activePost.username || t("photo.username")}</strong>
            <span>{formatTimelineDate(activePost.date, activePost.time, locale)}</span>
            <small>
              {t("post.timelinePosition", {
                position: activePosition,
                count: sortedPosts.length,
              })}
            </small>
          </div>
        </header>

      <EditorDisclosure
        defaultOpen
        description={t("photo.profileDescription")}
        number="01"
        title={t("photo.profileTitle")}
      >
        <ImageUploadField
          id="profile-image"
          image={activeImages.profileImage}
          label={t("common.profileImage")}
          onChange={(image) => onProfileImageChange(activePost.id, image)}
          onError={onImageError}
        />
        <div className="field-row">
          <label className="field">
            <span className="field-label">{t("photo.username")}</span>
            <input
              ref={authorInputRef}
              maxLength={fieldLimits.photoPost.username}
              onChange={(event) => updatePost({ username: event.target.value })}
              value={activePost.username}
            />
          </label>
          <label className="field">
            <span className="field-label">{t("photo.location")}</span>
            <input
              maxLength={fieldLimits.photoPost.location}
              onChange={(event) => updatePost({ location: event.target.value })}
              value={activePost.location}
            />
          </label>
        </div>
        <StructuredTimestampFields
          date={activePost.date}
          onDateChange={(date) => updatePost({ date })}
          onTimeChange={(time) => updatePost({ time })}
          time={activePost.time}
        />
        <label className="field">
          <span className="field-label">{t("common.viewMode")}</span>
          <select
            onChange={(event) =>
              updatePost({
                viewMode: event.target.value as PhotoPost["viewMode"],
              })
            }
            value={activePost.viewMode}
          >
            <option value="post">{t("common.fullPost")}</option>
            <option value="comments">{t("common.commentView")}</option>
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
          <span>{t("photo.showLocation")}</span>
        </label>
      </EditorDisclosure>

      <EditorDisclosure
        description={t("photo.carouselDescription")}
        number="02"
        title={t("photo.carousel")}
      >
        <div className="editor-section-actions">
          <button
            className="button button--secondary"
            disabled={activePost.media.length >= fieldLimits.photoPost.media}
            onClick={addMedia}
            type="button"
          >
            <Plus aria-hidden="true" size={17} />
            {t("photo.medium")}
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
                aria-label={`${t("photo.medium")} ${index + 1} ${t("common.select")}`}
                className="post-selector__select"
                onClick={() => updatePost({ activeMediaId: media.id })}
                type="button"
              >
                <strong>{t("photo.medium")} {index + 1}</strong>
                <span>{media.mode === "video" ? t("photo.video") : t("photo.image")}</span>
              </button>
              <div className="message-editor-card__actions">
                <button
                  aria-label={`${t("photo.medium")} ${index + 1} ${t("common.moveUp")}`}
                  className="compact-icon-button"
                  disabled={index === 0}
                  onClick={() => moveMedia(index, -1)}
                  type="button"
                >
                  <ArrowUp aria-hidden="true" size={15} />
                </button>
                <button
                  aria-label={`${t("photo.medium")} ${index + 1} ${t("common.moveDown")}`}
                  className="compact-icon-button"
                  disabled={index === activePost.media.length - 1}
                  onClick={() => moveMedia(index, 1)}
                  type="button"
                >
                  <ArrowDown aria-hidden="true" size={15} />
                </button>
                <button
                  aria-label={`${t("photo.medium")} ${index + 1} ${t("common.delete")}`}
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
          label={t("photo.mediumFile", {
            index: activePost.media.indexOf(activeMedia) + 1,
          })}
          onChange={(image) =>
            onMediaImageChange(activePost.id, activeMedia.id, image)
          }
          onError={onImageError}
        />
        <label className="field">
          <span className="field-label">{t("photo.mediaType")}</span>
          <select
            onChange={(event) =>
              updateMedia(activeMedia.id, {
                mode: event.target.value as PhotoMedia["mode"],
              })
            }
            value={activeMedia.mode}
          >
            <option value="image">{t("photo.image")}</option>
            <option value="video">{t("photo.videoSimulation")}</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">{t("photo.altText")}</span>
          <input
            maxLength={fieldLimits.photoPost.imageAlt}
            onChange={(event) =>
              updateMedia(activeMedia.id, { imageAlt: event.target.value })
            }
            placeholder={t("photo.altPlaceholder")}
            value={activeMedia.imageAlt}
          />
        </label>
        {activeMedia.mode === "video" && (
          <div className="field-row">
            <label className="field">
              <span className="field-label">{t("photo.duration")}</span>
              <input
                maxLength={fieldLimits.photoPost.videoDuration}
                onChange={(event) =>
                  updateMedia(activeMedia.id, {
                    videoDuration: event.target.value,
                  })
                }
                placeholder={t("photo.durationPlaceholder")}
                value={activeMedia.videoDuration}
              />
            </label>
            <label className="field">
              <span className="field-label">{t("photo.views")}</span>
              <input
                maxLength={fieldLimits.photoPost.videoViews}
                onChange={(event) =>
                  updateMedia(activeMedia.id, {
                    videoViews: event.target.value,
                  })
                }
                placeholder={t("photo.viewsPlaceholder")}
                value={activeMedia.videoViews}
              />
            </label>
          </div>
        )}
      </EditorDisclosure>

      <EditorDisclosure
        defaultOpen
        description={t("photo.contentDescription")}
        number="03"
        title={t("photo.contentTitle")}
      >
        <div className="field">
          <span className="field-label">{t("photo.caption")}</span>
          <EmojiTextarea
            aria-label={t("photo.caption")}
            maxLength={fieldLimits.photoPost.caption}
            onChange={(caption) => updatePost({ caption })}
            rows={4}
            value={activePost.caption}
          />
        </div>
        <div className="field-row">
          <label className="field">
            <span className="field-label">Likes</span>
            <input
              max={fieldLimits.common.metric}
              min={0}
              onChange={(event) =>
                updatePost({ likes: parseMetricInput(event.target.value) })
              }
              step={1}
              type="number"
              value={activePost.likes}
            />
          </label>
          <label className="field">
            <span className="field-label">{t("photo.commentCount")}</span>
            <input
              max={fieldLimits.common.metric}
              min={0}
              onChange={(event) =>
                updatePost({
                  commentCount: parseMetricInput(event.target.value),
                })
              }
              step={1}
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
          <span>{t("photo.showComments")}</span>
        </label>
      </EditorDisclosure>

      <EditorDisclosure
        description={t("comment.discussion")}
        number="04"
        title={`${t("common.comments")} ${locale === "de" ? "und" : "and"} ${t("common.replies")}`}
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
      </section>
    </form>
  );
}
