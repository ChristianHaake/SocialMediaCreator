import { ArrowLeft, Coffee, ExternalLink } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "../../i18n";

const copy = {
  de: {
    title: "Unterstützen",
    heading: "Wenn dir die App hilft, spendier mir einen Kaffee",
    description:
      "SocialMediaCreator bleibt kostenlos, auch ohne Beitrag. Ich pflege die App, behebe Fehler und teste sie auf verschiedenen Geräten. Ein Kaffee unterstützt diese Arbeit freiwillig.",
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
      "SocialMediaCreator stays free, with or without a contribution. I maintain the app, fix bugs and test it on different devices. A coffee supports this work voluntarily.",
    coffee: "Buy me a coffee",
    external: "This link opens Buy Me a Coffee in a new tab. The provider is contacted only then; this page loads no donation widget.",
    otherTitle: "Help without paying",
    otherDescription:
      "A bug report or an idea also helps me improve SocialMediaCreator.",
    report: "Report an error",
    suggest: "Suggest a feature",
    contact: "For other questions:",
  },
  fr: {
    title: "Soutenir",
    heading: "Si l’application vous aide, offrez-moi un café",
    description:
      "SocialMediaCreator reste gratuit, avec ou sans contribution. J’entretiens l’application, corrige les bugs et la teste sur différents appareils. Un café soutient librement ce travail.",
    coffee: "Offrir un café",
    external:
      "Ce lien ouvre Buy Me a Coffee dans un nouvel onglet. Le fournisseur n’est contacté qu’à ce moment-là ; cette page ne charge aucun widget de don.",
    otherTitle: "Aider sans payer",
    otherDescription:
      "Un signalement de bug ou une idée m’aide aussi à améliorer SocialMediaCreator.",
    report: "Signaler un bug",
    suggest: "Proposer une fonctionnalité",
    contact: "Pour toute autre question :",
  },
  es: {
    title: "Apoyar",
    heading: "Si la aplicación te ayuda, invítame a un café",
    description:
      "SocialMediaCreator sigue siendo gratuita, con o sin aportaciones. Mantengo la aplicación, corrijo errores y la pruebo en distintos dispositivos. Un café apoya este trabajo de forma voluntaria.",
    coffee: "Invitar a un café",
    external:
      "Este enlace abre Buy Me a Coffee en una pestaña nueva. El proveedor solo recibe una conexión entonces; esta página no carga ningún widget de donación.",
    otherTitle: "Ayudar sin pagar",
    otherDescription:
      "Un informe de error o una idea también me ayuda a mejorar SocialMediaCreator.",
    report: "Informar de un error",
    suggest: "Proponer una función",
    contact: "Para otras preguntas:",
  },
  nl: {
    title: "Steunen",
    heading: "Als de app je helpt, trakteer me op een koffie",
    description:
      "SocialMediaCreator blijft gratis, met of zonder bijdrage. Ik onderhoud de app, los fouten op en test hem op verschillende apparaten. Met een koffie steun je dit werk vrijwillig.",
    coffee: "Trakteer op koffie",
    external:
      "Deze link opent Buy Me a Coffee in een nieuw tabblad. De aanbieder wordt pas dan benaderd; deze pagina laadt geen donatiewidget.",
    otherTitle: "Helpen zonder te betalen",
    otherDescription:
      "Een bugmelding of idee helpt me ook om SocialMediaCreator te verbeteren.",
    report: "Een fout melden",
    suggest: "Een functie voorstellen",
    contact: "Voor andere vragen:",
  },
} as const;

export function SupportPage() {
  const { locale, t } = useTranslation();
  const c = copy[locale];
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);
  useEffect(() => {
    document.title = `${c.title} · SocialMediaCreator`;
    return () => { document.title = "SocialMediaCreator"; };
  }, [c.title]);

  return (
    <main className="content-shell support-page">
      <a className="back-link" href="/">
        <ArrowLeft aria-hidden="true" size={18} />
        {t("content.back")}
      </a>
      <article className="markdown-page support-page__article">
        <div className="support-page__hero">
          <Coffee className="support-page__icon" aria-hidden="true" size={28} />
          <h1 id="content-title" tabIndex={-1} ref={heading}>{c.title}</h1>
          <h2>{c.heading}</h2>
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
          <p>{c.description}</p>
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
