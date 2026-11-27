import { useRef } from "react";
import { CreatorDialog } from "../../creator/CreatorShell";
import { useTranslation } from "../../i18n";

type TeacherInfoDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function TeacherInfoDialog({ open, onClose }: TeacherInfoDialogProps) {
  const { t } = useTranslation();
  const returnFocus = useRef<HTMLElement>(null);
  if (!open) return null;
  return (
    <CreatorDialog
      open={open}
      returnFocus={returnFocus}
      title={t("teacher.title")}
      cancelLabel={t("teacher.close")}
      className="info-dialog"
      onCancel={onClose}
      closeOnBackdrop
    >
      <div className="info-dialog__content">
        <ul>
          <li>{t("teacher.item1")}</li>
          <li>{t("teacher.item2")}</li>
          <li>{t("teacher.item3")}</li>
          <li>{t("teacher.item4")}</li>
        </ul>
        <p>{t("teacher.note")}</p>
        <a
          className="button button--primary dialog-primary-link"
          href="/lehrkraefte"
        >
          {t("teacher.more")}
        </a>
      </div>
    </CreatorDialog>
  );
}
