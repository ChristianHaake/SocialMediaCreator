import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "../i18n";

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
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </main>
  );
}
