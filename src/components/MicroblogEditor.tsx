import { Plus } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { fieldLimits } from "../constraints";
import type {
  ImageState,
  MicroblogImages,
  MicroblogPost,
  MicroblogState,
} from "../types";
import { createId } from "../utils/ids";
import { useTranslation } from "../i18n";
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

type MicroblogEditorProps = {
  value: MicroblogState;
  onChange: Dispatch<SetStateAction<MicroblogState>>;
  images: MicroblogImages;
  onProfileImageChange: (postId: string, image: ImageState | null) => void;
  onCommentImageChange: (
    postId: string,
    itemId: string,
    image: ImageState | null,
  ) => void;
  onImagesRemoved: (postId: string, ids: string[]) => void;
  onPostRemoved: (postId: string) => void;
  onImageError: (message: string | null) => void;
};

function createMicroblogPost(locale: "de" | "en"): MicroblogPost {
  return {
    id: createId("microblog-post"),
    displayName: locale === "de" ? "Neues Profil" : "New profile",
    handle: locale === "de" ? "neues_profil" : "new_profile",
    text: locale === "de" ? "Neuer Beitrag" : "New post",
    date: todayInputValue(),
    time: "",
    viewMode: "post",
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
  onCommentImageChange,
  onImagesRemoved,
  onPostRemoved,
  onImageError,
}: MicroblogEditorProps) {
  const { locale, t } = useTranslation();
  const activePost =
    value.posts.find((post) => post.id === value.activePostId) ?? value.posts[0];
  const activeImages = images[activePost.id] ?? {
    profileImage: null,
    commentImages: {},
  };
  const sortedPosts = sortTimelinePosts(value.posts, value.sortOrder);

  function updatePost(changes: Partial<Omit<MicroblogPost, "id">>) {
    onChange((current) => ({
      ...current,
      posts: current.posts.map((post) =>
        post.id === current.activePostId ? { ...post, ...changes } : post,
      ),
    }));
  }

  function addPost() {
    const post = createMicroblogPost(locale);
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

  return (
    <form className="editor-form" onSubmit={(event) => event.preventDefault()}>
      <EditorDisclosure
        description={t("microblog.appearanceDescription")}
        number="01"
        title={t("common.appearance")}
      >
        <ThemeSelector
          onChange={(theme) => onChange((current) => ({ ...current, theme }))}
          value={value.theme}
        />
        <label className="field">
          <span className="field-label">{t("microblog.timelineLayout")}</span>
          <select
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                layoutMode: event.target.value as MicroblogState["layoutMode"],
              }))
            }
            value={value.layoutMode}
          >
            <option value="feed">{t("microblog.feed")}</option>
            <option value="thread">{t("microblog.thread")}</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">{t("common.timelineOrder")}</span>
          <select
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                sortOrder: event.target.value as MicroblogState["sortOrder"],
              }))
            }
            value={value.sortOrder}
          >
            <option value="newest">{t("common.newest")}</option>
            <option value="oldest">{t("common.oldest")}</option>
          </select>
        </label>
      </EditorDisclosure>

      <EditorDisclosure
        defaultOpen
        description={t(
          value.posts.length === 1
            ? "photo.postsDescription.one"
            : "photo.postsDescription.other",
          { count: value.posts.length },
        )}
        number="02"
        title={t("common.posts")}
      >
        <div className="editor-section-actions">
          <button
            className="button button--secondary"
            disabled={value.posts.length >= fieldLimits.common.posts}
            onClick={addPost}
            type="button"
          >
            <Plus aria-hidden="true" size={17} />
            {t("common.post")}
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
            summary: post.text || t("common.noText"),
            timestamp: formatTimelineDate(post.date, post.time, locale),
          }))}
        />
      </EditorDisclosure>

      <EditorDisclosure
        defaultOpen
        description={t("microblog.profileDescription")}
        number="03"
        title={t("microblog.profile")}
      >
        <ImageUploadField
          id="microblog-profile-image"
          image={activeImages.profileImage}
          label={t("common.profileImage")}
          onChange={(image) => onProfileImageChange(activePost.id, image)}
          onError={onImageError}
        />
        <div className="field-row">
          <label className="field">
            <span className="field-label">{t("microblog.displayName")}</span>
            <input
              maxLength={fieldLimits.microblog.displayName}
              onChange={(event) =>
                updatePost({ displayName: event.target.value })
              }
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
          </label>
        </div>
      </EditorDisclosure>

      <EditorDisclosure
        defaultOpen
        description={t("microblog.contentDescription")}
        number="04"
        title={t("microblog.contentTitle")}
      >
        <label className="field">
          <span className="field-label">{t("microblog.postText")}</span>
          <textarea
            aria-label={t("microblog.postText")}
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
            {t("microblog.characters", { count: activePost.text.length })}
            {activePost.text.length > 280
              ? t("microblog.long")
              : ""}
          </span>
        </label>
        <div className="field-row">
          <label className="field">
            <span className="field-label">{t("common.date")}</span>
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
            <span className="field-label">{t("common.timeOptional")}</span>
            <input
              onChange={(event) => updatePost({ time: event.target.value })}
              type="time"
              value={activePost.time}
            />
          </label>
        </div>
        <label className="field">
          <span className="field-label">{t("common.viewMode")}</span>
          <select
            onChange={(event) =>
              updatePost({
                viewMode: event.target.value as MicroblogPost["viewMode"],
              })
            }
            value={activePost.viewMode}
          >
            <option value="post">{t("common.fullPost")}</option>
            <option value="comments">{t("common.commentView")}</option>
          </select>
        </label>
      </EditorDisclosure>

      <EditorDisclosure
        description={t("microblog.reactionsDescription")}
        number="05"
        title={t("microblog.reactions")}
      >
        <div className="field-row field-row--three">
          {[
            [t("common.replies"), "replies"],
            [t("microblog.reposts"), "reposts"],
            [t("microblog.likes"), "likes"],
          ].map(([label, key]) => (
            <label className="field" key={key}>
              <span className="field-label">{label}</span>
              <input
                min={0}
                onChange={(event) =>
                  updatePost({
                    [key]: Math.max(0, Number(event.target.value)),
                  })
                }
                type="number"
                value={activePost[key as "replies" | "reposts" | "likes"]}
              />
            </label>
          ))}
        </div>
      </EditorDisclosure>

      <EditorDisclosure
        description={t("comment.discussion")}
        number="06"
        title={`${t("common.comments")} ${locale === "de" ? "und" : "and"} ${t("common.replies")}`}
      >
        <CommentEditor
          comments={activePost.comments}
          idPrefix="microblog"
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
