import { X } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent } from "react";

type TeacherInfoDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function TeacherInfoDialog({
  open,
  onClose,
}: TeacherInfoDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();

    return () => {
      const previousFocus = previousFocusRef.current;
      window.setTimeout(() => previousFocus?.focus(), 0);
    };
  }, [open]);

  if (!open) return null;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      aria-labelledby="teacher-dialog-title"
      aria-modal="true"
      className="dialog-backdrop"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
    >
      <div
        className="info-dialog"
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
      >
        <div className="info-dialog__header">
          <div>
            <span className="panel-kicker">Für den Unterricht</span>
            <h2 id="teacher-dialog-title">Hinweise für Lehrkräfte</h2>
          </div>
          <button
            aria-label="Dialog schließen"
            className="icon-button"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </div>
        <div className="info-dialog__content">
          <ul>
            <li>Texte und ausgewählte Bilder werden nicht hochgeladen.</li>
            <li>Es gibt keine Anmeldung, Datenbank oder Nutzungsanalyse.</li>
            <li>
              Konfigurationen und Bilder werden ausschließlich lokal erzeugt.
            </li>
            <li>
              Das Werkzeug eignet sich für fiktive Beiträge, Rollenarbeit,
              Medienanalyse und Quellenkritik.
            </li>
          </ul>
          <p>
            Verwende keine echten personenbezogenen Daten oder privaten
            Chatverläufe. Technische Verbindungsdaten entstehen beim Abruf der
            Website über den Hosting-Anbieter.
          </p>
        </div>
      </div>
    </div>
  );
}
