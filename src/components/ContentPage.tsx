import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ContentPageProps = {
  content: string;
  title: string;
};

export function ContentPage({ content, title }: ContentPageProps) {
  return (
    <main className="content-shell">
      <a className="back-link" href="/">
        <ArrowLeft aria-hidden="true" size={18} />
        Zurück zur App
      </a>
      <article className="markdown-page">
        <h1>{title}</h1>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </main>
  );
}
