import { Trash2 } from "lucide-react";
import { useTranslation } from "../../i18n";

type TimelinePost = {
  author: string;
  id: string;
  summary: string;
  timestamp: string;
};

type TimelinePostListProps = {
  activeId: string;
  posts: TimelinePost[];
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
};

export function TimelinePostList({
  activeId,
  posts,
  onRemove,
  onSelect,
}: TimelinePostListProps) {
  const { t } = useTranslation();
  return (
    <ol className="post-selector-list">
      {posts.map((post, index) => (
        <li
          className={
            post.id === activeId
              ? "post-selector post-selector--active"
              : "post-selector"
          }
          key={post.id}
        >
          <button
            aria-label={t("post.select", {
              author: post.author,
              date: post.timestamp,
            })}
            className="post-selector__select"
            onClick={() => onSelect(post.id)}
            type="button"
          >
            <span className="post-selector__heading">
              <strong>{post.author}</strong>
              {post.id === activeId && (
                <span className="post-selector__badge">{t("post.active")}</span>
              )}
            </span>
            <span>{post.summary}</span>
            <small>
              {post.timestamp} · {t("post.timelinePosition", {
                position: index + 1,
                count: posts.length,
              })}
            </small>
          </button>
          <div className="post-selector__actions">
            <button
              aria-label={t("post.delete", {
                author: post.author,
                date: post.timestamp,
              })}
              className="compact-icon-button compact-icon-button--danger"
              disabled={posts.length === 1}
              onClick={() => onRemove(post.id)}
              type="button"
            >
              <Trash2 aria-hidden="true" size={16} />
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}
