import { ArrowLeft, FileCheck2, FileQuestion, FileWarning } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import {
  verifyImageMarker,
  type VerificationResult,
} from "../utils/exportImage";

export function VerificationPage() {
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
        Zurück zur App
      </a>
      <article className="markdown-page verification-page">
        <h1>Bild verifizieren</h1>
        <p>
          Prüfe lokal, ob eine PNG- oder JPG-Datei einen intakten
          SocialMediaCreator-Herkunftsmarker enthält. Die Datei wird nicht
          hochgeladen.
        </p>
        <label className="verification-upload button button--primary">
          <FileCheck2 aria-hidden="true" size={19} />
          {checking ? "Prüfe Datei..." : "Bild auswählen"}
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
              <h2>Gültiger Herkunftsmarker</h2>
              <p>
                Modul: {result.marker.module}. Exportiert am{" "}
                {new Date(result.marker.exportedAt).toLocaleString("de-DE")}.
              </p>
            </div>
          </div>
        )}
        {result?.status === "modified" && (
          <div className="verification-result verification-result--warning" role="alert">
            <FileWarning aria-hidden="true" />
            <div>
              <h2>Datei nachträglich verändert</h2>
              <p>
                Der Marker ist vorhanden, die Prüfsumme stimmt aber nicht mit
                den Bilddaten überein.
              </p>
            </div>
          </div>
        )}
        {result?.status === "none" && (
          <div className="verification-result" role="status">
            <FileQuestion aria-hidden="true" />
            <div>
              <h2>Kein unterstützter Marker</h2>
              <p>
                Die Datei wurde nicht mit einem erkennbaren
                SocialMediaCreator-Marker exportiert oder der Marker wurde
                entfernt.
              </p>
            </div>
          </div>
        )}

        <aside className="verification-disclaimer">
          Der Marker ist ein pädagogischer Herkunftshinweis. Er ist kein
          fälschungssicherer Echtheitsbeweis und kann durch erneutes Speichern,
          Plattformverarbeitung oder Bildbearbeitung entfernt werden.
        </aside>
      </article>
    </main>
  );
}
