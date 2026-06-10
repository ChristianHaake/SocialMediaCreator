import { X } from "lucide-react";
import { useEffect, useRef } from "react";

type TeacherInfoDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function TeacherInfoDialog({
  open,
  onClose,
}: TeacherInfoDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      aria-labelledby="teacher-dialog-title"
      aria-modal="true"
      className="dialog-backdrop"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      role="dialog"
    >
      <div
        className="info-dialog"
        onClick={(event) => event.stopPropagation()}
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
