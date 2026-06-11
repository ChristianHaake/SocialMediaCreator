import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

type SortablePost = {
  id: string;
  summary: string;
};

type SortablePostListProps = {
  activeId: string;
  posts: SortablePost[];
  onMove: (activeId: string, overId: string) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
};

type SortablePostItemProps = SortablePostListProps & {
  index: number;
  keyboardActiveId: string | null;
  onKeyboardActiveChange: (id: string | null) => void;
  post: SortablePost;
};

function SortablePostItem({
  activeId,
  index,
  keyboardActiveId,
  post,
  posts,
  onMove,
  onKeyboardActiveChange,
  onRemove,
  onSelect,
}: SortablePostItemProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: post.id });
  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };
  const isKeyboardActive = keyboardActiveId === post.id;

  function handleKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      onKeyboardActiveChange(isKeyboardActive ? null : post.id);
      return;
    }
    if (event.key === "Escape" && isKeyboardActive) {
      event.preventDefault();
      onKeyboardActiveChange(null);
      return;
    }
    if (!isKeyboardActive) return;
    if (event.key === "ArrowUp" && index > 0) {
      event.preventDefault();
      onMove(post.id, posts[index - 1].id);
    } else if (event.key === "ArrowDown" && index < posts.length - 1) {
      event.preventDefault();
      onMove(post.id, posts[index + 1].id);
    }
  }

  return (
    <li
      className={[
        post.id === activeId
          ? "post-selector post-selector--active"
          : "post-selector",
        isDragging || isKeyboardActive ? "post-selector--dragging" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      ref={setNodeRef}
      style={style}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Beitrag ${index + 1} verschieben`}
        aria-pressed={isKeyboardActive}
        className="compact-icon-button post-selector__drag"
        onKeyDown={handleKeyboard}
        ref={setActivatorNodeRef}
        type="button"
      >
        <GripVertical aria-hidden="true" size={17} />
      </button>
      <button
        aria-label={`Beitrag ${index + 1} auswählen`}
        className="post-selector__select"
        onClick={() => onSelect(post.id)}
        type="button"
      >
        <strong>Beitrag {index + 1}</strong>
        <span>{post.summary}</span>
      </button>
      <div className="post-selector__actions">
        <button
          aria-label={`Beitrag ${index + 1} nach oben verschieben`}
          className="compact-icon-button"
          disabled={index === 0}
          onClick={() => onMove(post.id, posts[index - 1]?.id)}
          type="button"
        >
          <ArrowUp aria-hidden="true" size={15} />
        </button>
        <button
          aria-label={`Beitrag ${index + 1} nach unten verschieben`}
          className="compact-icon-button"
          disabled={index === posts.length - 1}
          onClick={() => onMove(post.id, posts[index + 1]?.id)}
          type="button"
        >
          <ArrowDown aria-hidden="true" size={15} />
        </button>
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
  );
}

export function SortablePostList(props: SortablePostListProps) {
  const [isPointerSorting, setIsPointerSorting] = useState(false);
  const [keyboardActiveId, setKeyboardActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );
  const isSorting = isPointerSorting || keyboardActiveId !== null;

  function handleDragEnd(event: DragEndEvent) {
    setIsPointerSorting(false);
    if (event.over && event.active.id !== event.over.id) {
      props.onMove(String(event.active.id), String(event.over.id));
    }
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragCancel={() => setIsPointerSorting(false)}
      onDragEnd={handleDragEnd}
      onDragStart={() => setIsPointerSorting(true)}
      sensors={sensors}
    >
      <SortableContext
        items={props.posts.map(({ id }) => id)}
        strategy={verticalListSortingStrategy}
      >
        <ol
          aria-busy={isSorting}
          className={
            isSorting
              ? "post-selector-list post-selector-list--sorting"
              : "post-selector-list"
          }
        >
          {props.posts.map((post, index) => (
            <SortablePostItem
              {...props}
              index={index}
              keyboardActiveId={keyboardActiveId}
              key={post.id}
              onKeyboardActiveChange={setKeyboardActiveId}
              post={post}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
