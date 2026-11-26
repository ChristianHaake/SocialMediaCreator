import { contentPages, isContentPath } from "../../content";
import { useTranslation } from "../../i18n";
import { ContentPage } from "./ContentPage";
import { SupportPage } from "./SupportPage";

type ContentRouteProps = {
  pathname: string;
};

export function ContentRoute({ pathname }: ContentRouteProps) {
  const { locale, t } = useTranslation();

  if (pathname === "/unterstuetzung") {
    return <SupportPage />;
  }

  if (isContentPath(pathname)) {
    return <ContentPage key={pathname} {...contentPages[locale][pathname]} />;
  }

  return (
    <ContentPage content={t("app.notFoundText")} title={t("app.notFound")} />
  );
}
