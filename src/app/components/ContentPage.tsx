import { ArrowLeft, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "../../i18n";
import { useEffect, useRef } from "react";

type ContentPageProps = {
  content: string;
  title: string;
};

export function ContentPage({ content, title }: ContentPageProps) {
  const { t } = useTranslation();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  useEffect(() => {
    document.title = `${title} · SocialMediaCreator`;
    return () => {
      document.title = "SocialMediaCreator";
    };
  }, [title]);
  return (
    <main className="content-shell">
      <a className="back-link" href="/">
        <ArrowLeft aria-hidden="true" size={18} />
        {t("content.back")}
      </a>
      <article className="markdown-page">
        <h1 id="content-title" tabIndex={-1} ref={heading}>
          {title}
        </h1>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => {
              const external = /^https?:\/\//.test(href ?? "");
              return (
                <a
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className={
                    href === "https://www.buymeacoffee.com/Haake"
                      ? "support-coffee"
                      : undefined
                  }
                >
                  {children}
                  {external && <ExternalLink aria-hidden="true" size={16} />}
                </a>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
    </main>
  );
}
