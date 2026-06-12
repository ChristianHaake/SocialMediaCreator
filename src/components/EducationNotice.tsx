import { GraduationCap } from "lucide-react";
import { useTranslation } from "../i18n";

export function EducationNotice() {
  const { t } = useTranslation();

  return (
    <aside className="education-notice">
      <GraduationCap aria-hidden="true" size={19} />
      <p>{t("education.notice")}</p>
      <a href="/verantwortungsvoll">{t("education.learnMore")}</a>
    </aside>
  );
}
