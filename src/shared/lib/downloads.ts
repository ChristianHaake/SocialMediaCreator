export function isStandaloneMode() {
  return (
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches) ||
    ("standalone" in navigator &&
      (navigator as unknown as { standalone?: boolean }).standalone === true)
  );
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = fileName;
  link.href = url;

  if (isStandaloneMode()) {
    // PWA standalone: <a download> is unreliable on many browsers.
    // Open the blob in a new tab so the user can long-press / save.
    link.target = "_blank";
    link.rel = "noopener";
  }

  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
