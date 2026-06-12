import { useTranslation } from "../i18n";

export function AppFooter() {
  const { t } = useTranslation();
  return (
    <footer className="app-footer">
      <span>{t("footer.local")}</span>
      <nav aria-label={t("footer.navigation")}>
        <a href="/hilfe">{t("footer.help")}</a>
        <a href="/ueber">{t("footer.about")}</a>
        <a href="/verifizieren">{t("footer.verify")}</a>
        <a href="/datenschutz">{t("footer.privacy")}</a>
        <a href="/impressum">{t("footer.legal")}</a>
        <a
          href="https://github.com/ChristianHaake/SocialMediaCreator"
          rel="noreferrer"
          target="_blank"
        >
          GitHub
        </a>
      </nav>
    </footer>
  );
}
