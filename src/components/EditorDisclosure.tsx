import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

type EditorDisclosureProps = {
  actions?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  description: string;
  number?: string;
  title: string;
};

export function EditorDisclosure({
  actions,
  children,
  defaultOpen = false,
  description,
  number,
  title,
}: EditorDisclosureProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      className="editor-disclosure"
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      open={isOpen}
    >
      <summary className="section-heading">
        {number && <span>{number}</span>}
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {actions && (
          <span className="editor-disclosure__actions">{actions}</span>
        )}
        <ChevronDown
          aria-hidden="true"
          className="editor-disclosure__chevron"
          size={18}
        />
      </summary>
      <div className="editor-disclosure__content">{children}</div>
    </details>
  );
}
