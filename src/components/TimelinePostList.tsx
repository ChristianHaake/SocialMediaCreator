import { Trash2 } from "lucide-react";

type TimelinePost = {
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
            aria-label={`Beitrag ${index + 1} auswählen`}
            className="post-selector__select"
            onClick={() => onSelect(post.id)}
            type="button"
          >
            <strong>Beitrag {index + 1}</strong>
            <span>{post.summary}</span>
            <small>{post.timestamp}</small>
          </button>
          <div className="post-selector__actions">
            <button
              aria-label={`Beitrag ${index + 1} löschen`}
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
