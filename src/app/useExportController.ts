import { useState, type RefObject } from "react";
import { hasExportConsent, storeExportConsent } from "../shared/lib/exportConsent";
import {
  exportElementAsImage,
  exportElementAsPdf,
  type ExportFormat,
  type ImageExportFormat,
} from "../shared/lib/exportImage";
import type { ModuleType } from "../domain/types";
import type { TranslationKey } from "../i18n/de";

export interface ExportControllerConfig {
  previewRef: RefObject<HTMLElement | null>;
  activeModule: ModuleType;
  locale: "de" | "en";
  t: (key: TranslationKey) => string;
}

export function useExportController({
  previewRef,
  activeModule,
  locale,
  t,
}: ExportControllerConfig) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [pendingExport, setPendingExport] = useState<ExportFormat | null>(null);
  const [exportConsentRequired, setExportConsentRequired] = useState(false);

  function requestExport(format: ExportFormat) {
    if (exporting) return;
    setExportConsentRequired(!hasExportConsent());
    setPendingExport(format);
  }

  function confirmExport() {
    if (!pendingExport) return;
    if (exportConsentRequired) storeExportConsent();

    const format = pendingExport;
    setPendingExport(null);
    if (format === "pdf") {
      void performPdfExport();
    } else {
      void performImageExport(format);
    }
  }

  function cancelExport() {
    setPendingExport(null);
  }

  async function performImageExport(format: ImageExportFormat) {
    if (!previewRef.current || exporting) return;

    setExportError(null);
    setExporting(format);
    try {
      await exportElementAsImage(
        previewRef.current,
        format,
        activeModule === "photoPost"
          ? "social-media-creator-foto-post"
          : activeModule === "messenger"
            ? "social-media-creator-messenger-chat"
            : "social-media-creator-mikroblog",
        activeModule,
      );
    } catch {
      setExportError(t("app.imageExportError"));
    } finally {
      setExporting(null);
    }
  }

  async function performPdfExport() {
    if (!previewRef.current || exporting) return;
    setExportError(null);
    setExporting("pdf");
    try {
      await exportElementAsPdf(
        previewRef.current,
        activeModule === "photoPost"
          ? "social-media-creator-foto-post"
          : activeModule === "messenger"
            ? "social-media-creator-messenger-chat"
            : "social-media-creator-mikroblog",
        locale,
      );
    } catch {
      setExportError(t("app.pdfExportError"));
    } finally {
      setExporting(null);
    }
  }

  return {
    exporting,
    exportError,
    setExportError,
    pendingExport,
    exportConsentRequired,
    requestExport,
    confirmExport,
    cancelExport,
  };
}
