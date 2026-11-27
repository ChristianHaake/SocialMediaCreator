import { CreatorHeader, CreatorLanguageMenu } from "../../creator/CreatorShell";
import { Check, GraduationCap } from "lucide-react";
import { useTranslation } from "../../i18n";

type AppHeaderProps = {
  onOpenTeacherInfo: () => void;
};

export function AppHeader({ onOpenTeacherInfo }: AppHeaderProps) {
  const { locale, setLocale, t } = useTranslation();
  return (
    <CreatorHeader
      className="app-header"
      identity={
        <a className="brand" href="/">
          <img
            alt="SocialMediaCreator"
            className="brand__logo"
            src="/brand/smc-logo-blue-wide.png"
          />
        </a>
      }
      controls={
        <div className="header-meta">
          <span className="privacy-badge">
            <Check aria-hidden="true" size={15} />
            {t("app.local")}
          </span>
          <div className="header-meta__controls">
            <CreatorLanguageMenu
              value={locale}
              languages={["de", "en", "fr", "es", "nl"]}
              onChange={setLocale}
              label={t("app.language")}
            />
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
      }
    />
  );
}
