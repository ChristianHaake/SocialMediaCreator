import { Plus } from "lucide-react";
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
  MicroblogImages,
  MicroblogPost,
  MicroblogState,
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

function parseMetricInput(value: string) {
  const next = Number(value);
  if (!Number.isFinite(next)) return 0;
  return Math.min(
    fieldLimits.common.metric,
    Math.max(0, Math.floor(next)),
  );
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
          author: post.displayName || t("microblog.displayName"),
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
        </div>
      </section>

      <section className="post-management">
        <header className="post-management__header">
          <div>
            <h3>{t("post.manage")}</h3>
            <p>
              {t(
                value.posts.length === 1
                  ? "microblog.postsDescription.one"
                  : "microblog.postsDescription.other",
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
            author: post.displayName || t("microblog.displayName"),
            id: post.id,
            summary: post.text || t("common.noText"),
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
            <strong>
              {activePost.displayName || t("microblog.displayName")}
            </strong>
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
        description={t("microblog.profileDescription")}
        number="01"
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
              ref={authorInputRef}
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
        number="02"
        title={t("microblog.contentTitle")}
      >
        <div className="field">
          <span className="field-label">{t("microblog.postText")}</span>
          <EmojiTextarea
            aria-label={t("microblog.postText")}
            maxLength={fieldLimits.microblog.text}
            onChange={(text) => updatePost({ text })}
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
        number="03"
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
                max={fieldLimits.common.metric}
                min={0}
                onChange={(event) =>
                  updatePost({
                    [key]: parseMetricInput(event.target.value),
                  })
                }
                step={1}
                type="number"
                value={activePost[key as "replies" | "reposts" | "likes"]}
              />
            </label>
          ))}
        </div>
      </EditorDisclosure>

      <EditorDisclosure
        description={t("comment.discussion")}
        number="04"
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
      </section>
    </form>
  );
}
