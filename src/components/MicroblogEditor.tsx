import { Plus } from "lucide-react";
import { arrayMove } from "@dnd-kit/sortable";
import type { Dispatch, SetStateAction } from "react";
import { fieldLimits } from "../constraints";
import type {
  ImageState,
  MicroblogImages,
  MicroblogPost,
  MicroblogState,
} from "../types";
import { createId } from "../utils/ids";
import { CommentEditor } from "./CommentEditor";
import { ImageUploadField } from "./ImageUploadField";
import { ThemeSelector } from "./ThemeSelector";
import { SortablePostList } from "./SortablePostList";

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
    timestamp: "gerade eben",
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
      posts: current.posts.flatMap((item) =>
        item.id === current.activePostId ? [item, post] : [item],
      ),
    }));
  }

  function movePost(activeId: string, overId: string) {
    if (!overId || activeId === overId) return;
    onChange((current) => {
      const from = current.posts.findIndex((post) => post.id === activeId);
      const to = current.posts.findIndex((post) => post.id === overId);
      if (from < 0 || to < 0) return current;
      return { ...current, posts: arrayMove(current.posts, from, to) };
    });
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
      <section className="editor-section">
        <div className="section-heading">
          <span>01</span>
          <div>
            <h2>Darstellung</h2>
            <p>Farbschema des gesamten Mikroblog-Moduls</p>
          </div>
        </div>
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
      </section>

      <section className="editor-section">
        <div className="section-heading section-heading--actions">
          <span>02</span>
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
        <SortablePostList
          activeId={activePost.id}
          onMove={movePost}
          onRemove={removePost}
          onSelect={(activePostId) =>
            onChange((current) => ({ ...current, activePostId }))
          }
          posts={value.posts.map((post) => ({
            id: post.id,
            summary: post.text || "Ohne Text",
          }))}
        />
      </section>

      <section className="editor-section">
        <div className="section-heading">
          <span>03</span>
          <div>
            <h2>Profil</h2>
            <p>Absender des ausgewählten Beitrags</p>
          </div>
        </div>
        <ImageUploadField
          id="microblog-profile-image"
          image={activeImages.profileImage}
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
        </label>
      </section>

      <section className="editor-section">
        <div className="section-heading">
          <span>04</span>
          <div>
            <h2>Inhalt und Ansicht</h2>
            <p>Text, Zeitstempel und Darstellungsmodus</p>
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
        <label className="field">
          <span className="field-label">Zeitstempel</span>
          <input
            maxLength={fieldLimits.common.timestamp}
            onChange={(event) => updatePost({ timestamp: event.target.value })}
            value={activePost.timestamp}
          />
        </label>
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
      </section>

      <section className="editor-section">
        <div className="section-heading">
          <span>05</span>
          <div>
            <h2>Reaktionen</h2>
            <p>Fiktive Kennzahlen des ausgewählten Beitrags</p>
          </div>
        </div>
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
      </section>

      <section className="editor-section">
        <div className="section-heading">
          <span>06</span>
          <div>
            <h2>Kommentare und Antworten</h2>
            <p>Zweistufige Diskussion zum ausgewählten Beitrag</p>
          </div>
        </div>
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
      </section>
    </form>
  );
}
