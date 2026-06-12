export const exportConsentStorageKey =
  "social-media-creator-export-consent";

type ExportConsent = {
  version: 1;
  acceptedAt: string;
};

export function hasExportConsent() {
  try {
    const stored = window.localStorage.getItem(exportConsentStorageKey);
    if (!stored) return false;
    const consent = JSON.parse(stored) as Partial<ExportConsent>;
    return consent.version === 1 && typeof consent.acceptedAt === "string";
  } catch {
    return false;
  }
}

export function storeExportConsent() {
  const consent: ExportConsent = {
    version: 1,
    acceptedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(
      exportConsentStorageKey,
      JSON.stringify(consent),
    );
    return true;
  } catch {
    return false;
  }
}
