import { useRef, useState } from "react";
import { CreatorDialog } from "../../creator/CreatorShell";
import { useTranslation } from "../../i18n";

type ExportNoticeDialogProps = {
  open: boolean;
  format: "png" | "jpg" | "pdf" | null;
  requiresConsent: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ExportNoticeDialog(props: ExportNoticeDialogProps) {
  return props.open ? <ExportConfirmation {...props} /> : null;
}

function ExportConfirmation({
  format,
  requiresConsent,
  onCancel,
  onConfirm,
}: ExportNoticeDialogProps) {
  const { t } = useTranslation();
  const [accepted, setAccepted] = useState(false);
  const returnFocus = useRef<HTMLElement>(null);

  return (
    <CreatorDialog
      open
      returnFocus={returnFocus}
      title={t("export.title")}
      cancelLabel={t("export.cancel")}
      className="info-dialog"
      onCancel={onCancel}
      closeOnBackdrop
      actions={
        <button
          className="button button--primary"
          disabled={requiresConsent && !accepted}
          onClick={onConfirm}
          type="button"
        >
          {t("export.continue")}
        </button>
      }
    >
      <div className="info-dialog__content export-dialog__content">
        <p className="export-dialog__message">{t("export.message")}</p>
        {format === "pdf" && (
          <p className="export-dialog__message">{t("export.pdfScope")}</p>
        )}
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
      </div>
    </CreatorDialog>
  );
}
