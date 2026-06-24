import { Coffee, Github } from "lucide-react";
import { useTranslation } from "../../i18n";

export function AppFooter() {
  const { t } = useTranslation();
  return (
    <footer className="app-footer">
      <span>{t("footer.local")}</span>
      <div className="app-footer__right">
        <nav aria-label={t("footer.navigation")}>
          <a href="/hilfe">{t("footer.help")}</a>
          <a className="app-footer__optional-link" href="/ueber">
            {t("footer.about")}
          </a>
          <a className="app-footer__optional-link" href="/verantwortungsvoll">
            {t("footer.responsible")}
          </a>
          <a className="app-footer__optional-link" href="/nutzungsbedingungen">
            {t("footer.terms")}
          </a>
          <a href="/verifizieren">{t("footer.verify")}</a>
          <a className="app-footer__narrow-link" href="/datenschutz">
            {t("footer.privacy")}
          </a>
          <a href="/impressum">{t("footer.legal")}</a>
        </nav>
        <a
          className="app-footer__coffee"
          href="https://buymeacoffee.com/Haake"
          rel="noreferrer"
          target="_blank"
        >
          <Coffee aria-hidden="true" size={16} />
          <span>{t("footer.coffee")}</span>
        </a>
        <a
          aria-label="GitHub"
          className="app-footer__github"
          href="https://github.com/ChristianHaake/SocialMediaCreator"
          rel="noreferrer"
          target="_blank"
        >
          <Github aria-hidden="true" size={20} />
        </a>
      </div>
    </footer>
  );
}
