import { ArrowLeft, AtSign, Instagram, Linkedin } from "lucide-react";
import { useTranslation } from "../../i18n";

const profiles = [
  { name: "LinkedIn", href: "https://www.linkedin.com/in/christianhaake/", Icon: Linkedin },
  { name: "Instagram", href: "https://www.instagram.com/_haake/", Icon: Instagram },
  { name: "Threads", href: "https://www.threads.com/@_haake", Icon: AtSign },
] as const;

export function ContactPage() {
  const { t } = useTranslation();
  return (
    <main className="content-shell">
      <a className="back-link" href="/">
        <ArrowLeft aria-hidden="true" size={18} />
        {t("content.back")}
      </a>
      <article className="markdown-page contact-page">
        <h1>{t("contact.title")}</h1>
        <p>{t("contact.description")}</p>
        <h2>{t("contact.emailHeading")}</h2>
        <p><a href="mailto:apps@haak3.de">apps@haak3.de</a></p>
        <h2>{t("contact.socialHeading")}</h2>
        <ul className="contact-page__profiles">
          {profiles.map(({ name, href, Icon }) => (
            <li key={name}>
              <a href={href} target="_blank" rel="noopener noreferrer">
                <Icon aria-hidden="true" size={20} />
                <span>{name}</span>
              </a>
            </li>
          ))}
        </ul>
      </article>
    </main>
  );
}
