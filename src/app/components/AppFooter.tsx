import { Coffee, Github } from "lucide-react";
import { useTranslation } from "../../i18n";

import { CreatorFooter } from "../../creator/CreatorFooter";

export function AppFooter() {
  const { locale, t } = useTranslation();
  return (
    <CreatorFooter
      locale={locale}
      className="app-footer"
      innerClassName="app-footer__right"
      navigationLabel={t("footer.navigation")}
      identity={<span>{t("footer.local")}</span>}
      links={
        <>
          <a href="/hilfe">{t("footer.help")}</a>
          <a href="/kontakt">
            {t("footer.contact")}
          </a>
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
        </>
      }
      actions={
        <>
          <a
            className="app-footer__coffee"
            href="/unterstuetzung"
          >
            <Coffee aria-hidden="true" size={16} />
            <span>{t("footer.coffee")}</span>
          </a>
          <a
            aria-label="GitHub"
            className="app-footer__github"
            href="https://github.com/ChristianHaake/SocialMediaCreator"
            rel="noopener noreferrer"
            target="_blank"
          >
            <Github aria-hidden="true" size={20} />
            <span className="repository-tooltip">GitHub Repository</span>
          </a>
        </>
      }
    />
  );
}
