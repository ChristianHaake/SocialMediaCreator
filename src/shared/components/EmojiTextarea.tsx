import { Smile } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from "react";
import { useTranslation } from "../../i18n";

type EmojiTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange" | "value"
> & {
  value: string;
  onChange: (value: string) => void;
};

const emojiOptions = [
  "🙂",
  "😀",
  "😄",
  "😊",
  "😍",
  "🤔",
  "😮",
  "😢",
  "😡",
  "👍",
  "👎",
  "👏",
  "🙌",
  "💪",
  "🙏",
  "❤️",
  "💙",
  "💚",
  "⭐",
  "✨",
  "🔥",
  "💡",
  "📌",
  "📚",
  "📝",
  "🔍",
  "✅",
  "⚠️",
  "❓",
  "➡️",
  "🌍",
  "🎯",
];

export function EmojiTextarea({
  className,
  maxLength,
  onChange,
  onKeyDown,
  value,
  ...textareaProps
}: EmojiTextareaProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [open]);

  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + emoji + value.slice(end);
    if (maxLength !== undefined && next.length > maxLength) return;

    const nextCursor = start + emoji.length;
    onChange(next);
    setOpen(false);
    window.setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
    }, 0);
  }

  function closeOnEscape(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && open) {
      setOpen(false);
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape" && open) {
      setOpen(false);
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onKeyDown?.(event);
  }

  return (
    <div
      className={`emoji-textarea${className ? ` ${className}` : ""}`}
      onKeyDown={closeOnEscape}
      ref={rootRef}
    >
      <div className="emoji-textarea__control">
        <textarea
          {...textareaProps}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleTextareaKeyDown}
          ref={textareaRef}
          value={value}
        />
        <button
          aria-expanded={open}
          aria-label={t("emoji.open")}
          className="emoji-textarea__button"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <Smile aria-hidden="true" size={17} />
        </button>
      </div>
      {open && (
        <div className="emoji-textarea__popover">
          {emojiOptions.map((emoji) => (
            <button
              aria-label={`${t("emoji.insert")} ${emoji}`}
              className="emoji-textarea__option"
              key={emoji}
              onClick={() => insertEmoji(emoji)}
              type="button"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
