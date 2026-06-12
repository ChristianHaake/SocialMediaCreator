import { X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useTranslation } from "../../i18n";

type ExportNoticeDialogProps = {
  open: boolean;
  requiresConsent: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ExportNoticeDialog({
  open,
  requiresConsent,
  onCancel,
  onConfirm,
}: ExportNoticeDialogProps) {
  const { t } = useTranslation();
  const [accepted, setAccepted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    setAccepted(false);
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
      onCancel();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length === 0) return;

    event.preventDefault();
    const currentIndex = focusable.indexOf(
      document.activeElement as HTMLElement,
    );
    const nextIndex = event.shiftKey
      ? (currentIndex - 1 + focusable.length) % focusable.length
      : (currentIndex + 1) % focusable.length;
    focusable[nextIndex].focus();
  }

  return (
    <div
      aria-labelledby="export-dialog-title"
      aria-modal="true"
      className="dialog-backdrop"
      onClick={onCancel}
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
            <span className="panel-kicker">{t("export.kicker")}</span>
            <h2 id="export-dialog-title">{t("export.title")}</h2>
          </div>
          <button
            aria-label={t("export.close")}
            className="icon-button"
            onClick={onCancel}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </div>
        <div className="info-dialog__content export-dialog__content">
          <p className="export-dialog__message">{t("export.message")}</p>
          <a href="/nutzungsbedingungen">{t("export.termsLink")}</a>
          {requiresConsent && (
            <label className="export-consent">
              <input
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                type="checkbox"
              />
              <span>{t("export.consent")}</span>
            </label>
          )}
          <div className="dialog-actions">
            <button
              className="button button--secondary"
              onClick={onCancel}
              type="button"
            >
              {t("export.cancel")}
            </button>
            <button
              className="button button--primary"
              disabled={requiresConsent && !accepted}
              onClick={onConfirm}
              type="button"
            >
              {t("export.continue")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
