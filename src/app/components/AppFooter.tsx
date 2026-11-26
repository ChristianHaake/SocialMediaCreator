import { Coffee, Github } from "lucide-react";
import { useTranslation } from "../../i18n";

export function AppFooter() {
  const { t } = useTranslation();
  return (
    <footer className="app-footer">
      <a
        className="app-footer__credit"
        href="https://haak3.de/"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("footer.by")} <strong>haak3</strong>
      </a>
      <div className="app-footer__right">
        <nav aria-label={t("footer.navigation")}>
          <a href="/hilfe">{t("footer.help")}</a>
          <a href="/ueber">{t("footer.about")}</a>
          <a href="/verantwortungsvoll">{t("footer.responsible")}</a>
          <a href="/nutzungsbedingungen">{t("footer.terms")}</a>
          <a href="/verifizieren">{t("footer.verify")}</a>
          <a href="/datenschutz">{t("footer.privacy")}</a>
          <a href="/impressum">{t("footer.legal")}</a>
        </nav>
        <a className="app-footer__coffee" href="/unterstuetzung">
          <Coffee aria-hidden="true" size={16} />
          <span>{t("footer.support")}</span>
        </a>
        <a
          aria-label={t("footer.repository")}
          className="app-footer__github"
          href="https://github.com/ChristianHaake/SocialMediaCreator"
          rel="noopener noreferrer"
          target="_blank"
        >
          <Github aria-hidden="true" size={20} />
          <span className="repository-tooltip" aria-hidden="true">
            {t("footer.repository")}
          </span>
        </a>
      </div>
    </footer>
  );
}
