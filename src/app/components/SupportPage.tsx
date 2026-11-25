import { ArrowLeft, Coffee, ExternalLink } from "lucide-react";
import { useTranslation } from "../../i18n";

const copy = {
  de: {
    title: "Unterstützen",
    heading: "Wenn dir die App hilft, spendier mir einen Kaffee",
    description:
      "SocialMediaCreator ist kostenlos. Ich pflege die App, behebe Fehler und teste sie auf verschiedenen Geräten. Wenn du sie gern nutzt, kannst du diese Arbeit freiwillig unterstützen.",
    coffee: "Kaffee spendieren",
    external: "Der Link öffnet Buy Me a Coffee in einem neuen Tab. Erst dort wird eine Verbindung zum Anbieter hergestellt; diese Seite lädt kein Spenden-Widget.",
    otherTitle: "Auch ohne Geld helfen",
    otherDescription:
      "Ein Fehlerbericht oder eine Idee hilft mir ebenfalls, SocialMediaCreator zu verbessern.",
    report: "Fehler melden",
    suggest: "Funktion vorschlagen",
    contact: "Für andere Fragen:",
  },
  en: {
    title: "Support",
    heading: "If the app helps you, buy me a coffee",
    description:
      "SocialMediaCreator is free. I maintain the app, fix bugs and test it on different devices. If you enjoy using it, you can support this work voluntarily.",
    coffee: "Buy me a coffee",
    external: "This link opens Buy Me a Coffee in a new tab. The provider is contacted only then; this page loads no donation widget.",
    otherTitle: "Help without paying",
    otherDescription:
      "A bug report or an idea also helps me improve SocialMediaCreator.",
    report: "Report an error",
    suggest: "Suggest a feature",
    contact: "For other questions:",
  },
} as const;

export function SupportPage() {
  const { locale, t } = useTranslation();
  const c = copy[locale];

  return (
    <main className="content-shell support-page">
      <a className="back-link" href="/">
        <ArrowLeft aria-hidden="true" size={18} />
        {t("content.back")}
      </a>
      <article className="markdown-page support-page__article">
        <div className="support-page__hero">
          <Coffee className="support-page__icon" aria-hidden="true" size={28} />
          <h1>{c.title}</h1>
          <h2>{c.heading}</h2>
          <p>{c.description}</p>
          <a
            className="support-page__action"
            href="https://buymeacoffee.com/Haake"
            rel="noopener noreferrer"
            target="_blank"
          >
            <Coffee aria-hidden="true" size={20} />
            {c.coffee}
            <ExternalLink aria-hidden="true" size={16} />
          </a>
          <p className="support-page__external">{c.external}</p>
        </div>
        <section className="support-page__other" aria-labelledby="support-other-title">
          <h2 id="support-other-title">{c.otherTitle}</h2>
          <p>{c.otherDescription}</p>
          <div className="support-page__links">
            <a
              href="https://haak3.atlassian.net/jira/software/form/69a50efc-0474-445e-8f01-66eb6b747cc1"
              rel="noopener noreferrer"
              target="_blank"
            >
              {c.report}
              <ExternalLink aria-hidden="true" size={16} />
            </a>
            <a
              href="https://haak3.atlassian.net/jira/software/form/50d4fc51-bff4-4e21-b46e-8fd987b90d24"
              rel="noopener noreferrer"
              target="_blank"
            >
              {c.suggest}
              <ExternalLink aria-hidden="true" size={16} />
            </a>
          </div>
          <p className="support-page__contact">
            {c.contact} <a href="mailto:apps@haak3.de">apps@haak3.de</a>
          </p>
        </section>
      </article>
    </main>
  );
}
