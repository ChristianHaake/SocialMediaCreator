import { ArrowLeft, FileCheck2, FileQuestion, FileWarning } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import {
  verifyImageMarker,
  type VerificationResult,
} from "../../shared/lib/imageMarkers";
import { useTranslation } from "../../i18n";

export function VerificationPage() {
  const { numberLocale, t } = useTranslation();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setChecking(true);
    try {
      setResult(await verifyImageMarker(file));
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="content-shell">
      <a className="back-link" href="/">
        <ArrowLeft aria-hidden="true" size={18} />
        {t("content.back")}
      </a>
      <article className="markdown-page verification-page">
        <h1>{t("verify.title")}</h1>
        <p>{t("verify.description")}</p>
        <label className="verification-upload button button--primary">
          <FileCheck2 aria-hidden="true" size={19} />
          {checking ? t("verify.checking") : t("verify.choose")}
          <input
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            className="visually-hidden"
            disabled={checking}
            onChange={handleFile}
            type="file"
          />
        </label>

        {result?.status === "valid" && (
          <div className="verification-result verification-result--valid" role="status">
            <FileCheck2 aria-hidden="true" />
            <div>
              <h2>{t("verify.valid")}</h2>
              <p>
                {t("verify.validText", {
                  module: result.marker.module,
                  date: new Date(result.marker.exportedAt).toLocaleString(
                    numberLocale,
                  ),
                })}
              </p>
            </div>
          </div>
        )}
        {result?.status === "modified" && (
          <div className="verification-result verification-result--warning" role="alert">
            <FileWarning aria-hidden="true" />
            <div>
              <h2>{t("verify.modified")}</h2>
              <p>{t("verify.modifiedText")}</p>
            </div>
          </div>
        )}
        {result?.status === "none" && (
          <div className="verification-result" role="status">
            <FileQuestion aria-hidden="true" />
            <div>
              <h2>{t("verify.none")}</h2>
              <p>{t("verify.noneText")}</p>
            </div>
          </div>
        )}

        <aside className="verification-disclaimer">
          {t("verify.disclaimer")}
        </aside>
      </article>
    </main>
  );
}
