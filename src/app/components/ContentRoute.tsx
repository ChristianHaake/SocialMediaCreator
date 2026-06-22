import { contentPages, isContentPath } from "../../content";
import { useTranslation } from "../../i18n";
import { ContentPage } from "./ContentPage";

type ContentRouteProps = {
  pathname: string;
};

export function ContentRoute({ pathname }: ContentRouteProps) {
  const { locale, t } = useTranslation();

  if (isContentPath(pathname)) {
    return <ContentPage {...contentPages[locale][pathname]} />;
  }

  return (
    <ContentPage
      content={t("app.notFoundText")}
      title={t("app.notFound")}
    />
  );
}
