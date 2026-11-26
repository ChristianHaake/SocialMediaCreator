import { Check, GraduationCap } from "lucide-react";
import { useTranslation } from "../../i18n";

type AppHeaderProps = {
  onOpenTeacherInfo: () => void;
};

export function AppHeader({ onOpenTeacherInfo }: AppHeaderProps) {
  const { locale, setLocale, t } = useTranslation();
  return (
    <header className="app-header">
      <a className="brand" href="/">
        <img
          alt="SocialMediaCreator"
          className="brand__logo"
          src="/brand/smc-logo-blue-wide.png"
        />
      </a>
      <div className="header-meta">
        <span className="privacy-badge">
          <Check aria-hidden="true" size={15} />
          {t("app.local")}
        </span>
        <div className="header-meta__controls">
          <div aria-label={t("app.language")} className="language-switch">
            {(["de", "en", "fr", "es", "nl"] as const).map((option) => (
              <button
                aria-label={({ de: "Deutsch", en: "English", fr: "Français", es: "Español", nl: "Nederlands" })[option]}
                aria-pressed={locale === option}
                key={option}
                onClick={() => setLocale(option)}
                type="button"
              >
                {({ de: "Deutsch", en: "English", fr: "Français", es: "Español", nl: "Nederlands" })[option]}
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
      </div>
    </header>
  );
}
