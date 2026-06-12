import { Check, GraduationCap, Image as ImageIcon } from "lucide-react";
import { useTranslation } from "../../i18n";

type AppHeaderProps = {
  onOpenTeacherInfo: () => void;
};

export function AppHeader({ onOpenTeacherInfo }: AppHeaderProps) {
  const { locale, setLocale, t } = useTranslation();
  return (
    <header className="app-header">
      <a className="brand" href="/">
        <span className="brand__mark">
          <ImageIcon aria-hidden="true" size={21} />
        </span>
        <span>
          <strong>SocialMediaCreator</strong>
          <small>{t("app.tagline")}</small>
        </span>
      </a>
      <div className="header-meta">
        <span className="privacy-badge">
          <Check aria-hidden="true" size={15} />
          {t("app.local")}
        </span>
        <div aria-label={t("app.language")} className="language-switch">
          {(["de", "en"] as const).map((option) => (
            <button
              aria-pressed={locale === option}
              key={option}
              onClick={() => setLocale(option)}
              type="button"
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          className="text-button"
          onClick={(event) => {
            event.currentTarget.focus();
            onOpenTeacherInfo();
          }}
          type="button"
        >
          <GraduationCap aria-hidden="true" size={18} />
          {t("app.teacher")}
        </button>
      </div>
    </header>
  );
}
