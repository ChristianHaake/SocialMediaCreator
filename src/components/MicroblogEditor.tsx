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

function createMicroblogPost(): MicroblogPost {
  return {
    id: createId("microblog-post"),
    displayName: "Neues Profil",
    handle: "neues_profil",
    text: "Neuer Beitrag",
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
    const post = createMicroblogPost();
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
        description="Farbschema, Layout und Reihenfolge"
        number="01"
        title="Darstellung"
      >
        <ThemeSelector
          onChange={(theme) => onChange((current) => ({ ...current, theme }))}
          value={value.theme}
        />
        <label className="field">
          <span className="field-label">Timeline-Darstellung</span>
          <select
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                layoutMode: event.target.value as MicroblogState["layoutMode"],
              }))
            }
            value={value.layoutMode}
          >
            <option value="feed">Feed mit getrennten Beiträgen</option>
            <option value="thread">Verbundener Thread</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Timeline-Reihenfolge</span>
          <select
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                sortOrder: event.target.value as MicroblogState["sortOrder"],
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
            summary: post.text || "Ohne Text",
            timestamp: formatTimelineDate(post.date, post.time),
          }))}
        />
      </EditorDisclosure>

      <EditorDisclosure
        defaultOpen
        description="Absender des ausgewählten Beitrags"
        number="03"
        title="Profil"
      >
        <ImageUploadField
          id="microblog-profile-image"
          image={activeImages.profileImage}
          label="Profilbild"
          onChange={(image) => onProfileImageChange(activePost.id, image)}
          onError={onImageError}
        />
        <div className="field-row">
          <label className="field">
            <span className="field-label">Anzeigename</span>
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
        description="Text, Veröffentlichungszeitpunkt und Ansicht"
        number="04"
        title="Inhalt und Ansicht"
      >
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
                viewMode: event.target.value as MicroblogPost["viewMode"],
              })
            }
            value={activePost.viewMode}
          >
            <option value="post">Vollständiger Beitrag</option>
            <option value="comments">Kommentaransicht</option>
          </select>
        </label>
      </EditorDisclosure>

      <EditorDisclosure
        description="Fiktive Kennzahlen des ausgewählten Beitrags"
        number="05"
        title="Reaktionen"
      >
        <div className="field-row field-row--three">
          {[
            ["Antworten", "replies"],
            ["Reposts", "reposts"],
            ["Likes", "likes"],
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
        description="Zweistufige Diskussion zum ausgewählten Beitrag"
        number="06"
        title="Kommentare und Antworten"
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
