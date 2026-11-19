import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "../../i18n";

type ContentPageProps = {
  content: string;
  title: string;
};

export function ContentPage({ content, title }: ContentPageProps) {
  const { t } = useTranslation();
  return (
    <main className="content-shell">
      <a className="back-link" href="/">
        <ArrowLeft aria-hidden="true" size={18} />
        {t("content.back")}
      </a>
      <article className="markdown-page">
        <h1>{title}</h1>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ children, href, node, ...props }) => {
              void node;
              return href?.startsWith("http") ? (
                <a {...props} href={href} rel="noopener noreferrer" target="_blank">
                  {children}
                </a>
              ) : (
                <a {...props} href={href}>
                  {children}
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
