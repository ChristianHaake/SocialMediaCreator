import { toJpeg, toPng } from "html-to-image";
import type { Locale, ModuleType } from "../../domain/types";

export type ImageExportFormat = "png" | "jpg";
export type ExportFormat = ImageExportFormat | "pdf";

const exportWidth = 1080;
const markerMagic = new TextEncoder().encode("SMC-MARKER-V1");
export const exportBadgeText = "SocialMediaCreator · Simulation";

export type ImageMarker = {
  appId: "SocialMediaCreator";
  markerVersion: 1;
  module: ModuleType;
  exportedAt: string;
  sha256: string;
};

export type VerificationResult =
  | { status: "valid"; marker: ImageMarker }
  | { status: "modified"; marker: ImageMarker }
  | { status: "none" };

export function calculatePageSlices(
  imageHeight: number,
  pixelsPerPage: number,
  safeBreaks: number[],
) {
  const slices: Array<{ y: number; height: number }> = [];
  const sortedBreaks = safeBreaks
    .filter((position) => position > 0 && position < imageHeight)
    .sort((left, right) => left - right);

  for (let y = 0; y < imageHeight; ) {
    const maximumEnd = Math.min(y + pixelsPerPage, imageHeight);
    const safeEnd =
      maximumEnd === imageHeight
        ? maximumEnd
        : sortedBreaks
            .filter(
              (position) => position > y + 1 && position <= maximumEnd,
            )
            .at(-1);
    const end = safeEnd ?? maximumEnd;
    slices.push({ y, height: end - y });
    y = end;
  }

  return slices;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function dataUrlToBlob(dataUrl: string) {
  const [header, encoded] = dataUrl.split(",");
  const mimeType = /data:([^;]+)/.exec(header)?.[1] ?? "application/octet-stream";
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function getExportBackground(element: HTMLElement) {
  if (element.classList.contains("theme-dark")) return "#000000";
  if (element.classList.contains("theme-dim")) return "#15202b";

  const computed = getComputedStyle(element).backgroundColor;
  return computed && computed !== "rgba(0, 0, 0, 0)"
    ? computed
    : "#ffffff";
}

async function renderElementBlob(
  element: HTMLElement,
  format: ImageExportFormat,
) {
  const scale = exportWidth / Math.max(element.offsetWidth, 1);
  const commonOptions = {
    backgroundColor: getExportBackground(element),
    cacheBust: true,
    pixelRatio: scale,
  };
  const badge = document.createElement("div");
  badge.dataset.exportBadge = "true";
  badge.textContent = exportBadgeText;
  Object.assign(badge.style, {
    position: "absolute",
    right: "12px",
    bottom: "12px",
    zIndex: "2147483647",
    padding: "7px 10px",
    border: "1px solid rgba(255, 255, 255, 0.45)",
    borderRadius: "7px",
    color: "#ffffff",
    background: "rgba(17, 24, 39, 0.88)",
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: "1",
    letterSpacing: "0.01em",
    pointerEvents: "none",
  });
  const previousPosition = element.style.position;
  if (getComputedStyle(element).position === "static") {
    element.style.position = "relative";
  }
  element.append(badge);
  element.dataset.exporting = "true";
  try {
    const dataUrl =
      format === "png"
        ? await toPng(element, commonOptions)
        : await toJpeg(element, { ...commonOptions, quality: 0.92 });
    return dataUrlToBlob(dataUrl);
  } finally {
    badge.remove();
    element.style.position = previousPosition;
    delete element.dataset.exporting;
  }
}

export async function addImageMarker(blob: Blob, module: ModuleType) {
  const imageBytes = new Uint8Array(await blob.arrayBuffer());
  const marker: ImageMarker = {
    appId: "SocialMediaCreator",
    markerVersion: 1,
    module,
    exportedAt: new Date().toISOString(),
    sha256: bytesToHex(await crypto.subtle.digest("SHA-256", imageBytes)),
  };
  const markerBytes = new TextEncoder().encode(JSON.stringify(marker));
  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, markerBytes.length);
  return new Blob([imageBytes, markerBytes, length, markerMagic], {
    type: blob.type,
  });
}

export async function verifyImageMarker(file: Blob): Promise<VerificationResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const trailerLength = markerMagic.length + 4;
  if (bytes.length <= trailerLength) return { status: "none" };

  const magicStart = bytes.length - markerMagic.length;
  const hasMagic = markerMagic.every(
    (byte, index) => bytes[magicStart + index] === byte,
  );
  if (!hasMagic) return { status: "none" };

  const lengthStart = magicStart - 4;
  const markerLength = new DataView(
    bytes.buffer,
    bytes.byteOffset + lengthStart,
    4,
  ).getUint32(0);
  const markerStart = lengthStart - markerLength;
  if (markerStart < 0) return { status: "none" };

  let marker: ImageMarker;
  try {
    marker = JSON.parse(
      new TextDecoder().decode(bytes.slice(markerStart, lengthStart)),
    ) as ImageMarker;
  } catch {
    return { status: "none" };
  }
  if (
    marker.appId !== "SocialMediaCreator" ||
    marker.markerVersion !== 1 ||
    !["photoPost", "messenger", "microblog"].includes(marker.module)
  ) {
    return { status: "none" };
  }

  const digest = bytesToHex(
    await crypto.subtle.digest("SHA-256", bytes.slice(0, markerStart)),
  );
  return digest === marker.sha256
    ? { status: "valid", marker }
    : { status: "modified", marker };
}

export async function exportElementAsImage(
  element: HTMLElement,
  format: ImageExportFormat,
  fileName = "social-media-creator-foto-post",
  module: ModuleType = "photoPost",
) {
  const blob = await renderElementBlob(element, format);
  const markedBlob = await addImageMarker(blob, module);
  downloadBlob(markedBlob, `${fileName}.${format}`);
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

export async function exportElementAsPdf(
  element: HTMLElement,
  fileName: string,
  locale: Locale = "de",
) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ format: "a4", orientation: "portrait", unit: "mm" });
  pdf.setProperties({
    title: "SocialMediaCreator Simulation",
    subject:
      locale === "de"
        ? "Lokal erzeugte SocialMediaCreator Simulation"
        : "Locally created SocialMediaCreator simulation",
    author: "SocialMediaCreator",
    creator: "SocialMediaCreator",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2 - 7;
  let pageCount = 0;

  function addExportFooter() {
    pdf.setFontSize(8);
    pdf.setTextColor(90, 96, 106);
    pdf.text(exportBadgeText, pageWidth - margin, pageHeight - 5, {
      align: "right",
    });
  }

  async function addRenderedPage(
    dataUrl: string,
    options: { fitSinglePage?: boolean; safeBreaks?: number[] } = {},
  ) {
    const image = await loadImage(dataUrl);
    if (options.fitSinglePage) {
      if (pageCount > 0) pdf.addPage();
      pageCount += 1;
      const scale = Math.min(
        contentWidth / image.width,
        contentHeight / image.height,
      );
      pdf.addImage(
        dataUrl,
        "PNG",
        margin + (contentWidth - image.width * scale) / 2,
        margin,
        image.width * scale,
        image.height * scale,
      );
      addExportFooter();
      return;
    }

    const pixelsPerPage = Math.floor(
      image.width * (contentHeight / contentWidth),
    );
    const cssToImageScale = image.width / Math.max(element.offsetWidth, 1);
    const safeBreaks = (options.safeBreaks ?? [])
      .map((position) => Math.round(position * cssToImageScale))
      .filter((position) => position > 0 && position < image.height)
      .sort((left, right) => left - right);

    for (const slice of calculatePageSlices(
      image.height,
      pixelsPerPage,
      safeBreaks,
    )) {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = slice.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("PDF-Seite konnte nicht erstellt werden.");
      context.drawImage(
        image,
        0,
        slice.y,
        image.width,
        slice.height,
        0,
        0,
        image.width,
        slice.height,
      );
      if (pageCount > 0) pdf.addPage();
      pageCount += 1;
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        margin,
        margin,
        contentWidth,
        contentWidth * (slice.height / image.width),
      );
      addExportFooter();
    }
  }

  async function renderCurrentState() {
    const scale = exportWidth / Math.max(element.offsetWidth, 1);
    return toPng(element, {
      backgroundColor: getExportBackground(element),
      cacheBust: true,
      pixelRatio: scale,
    });
  }

  function safeBreaksFor(selector: string) {
    const rootTop = element.getBoundingClientRect().top;
    return Array.from(element.querySelectorAll<HTMLElement>(selector)).map(
      (item) => item.getBoundingClientRect().bottom - rootTop,
    );
  }

  const articles = Array.from(
    element.querySelectorAll<HTMLElement>(
      ":scope > .photo-post, :scope > .microblog-preview",
    ),
  );

  if (articles.length === 0) {
    await addRenderedPage(await renderCurrentState(), {
      safeBreaks: safeBreaksFor(".message-row"),
    });
  } else {
    const articleDisplays = articles.map((article) => article.style.display);
    try {
      for (const article of articles) {
        articles.forEach((item) => {
          item.style.display = item === article ? "" : "none";
        });
        const media = Array.from(
          article.querySelectorAll<HTMLElement>(".photo-post__media"),
        );
        if (
          media.length === 0 ||
          article.classList.contains("photo-post--comments")
        ) {
          await addRenderedPage(await renderCurrentState(), {
            safeBreaks: safeBreaksFor(".comment-thread__group"),
          });
          continue;
        }
        const mediaDisplays = media.map((item) => item.style.display);
        try {
          for (const activeMedium of media) {
            media.forEach((item) => {
              item.style.display = item === activeMedium ? "block" : "none";
            });
            await addRenderedPage(await renderCurrentState(), {
              fitSinglePage: true,
            });
          }
        } finally {
          media.forEach((item, index) => {
            item.style.display = mediaDisplays[index];
          });
        }
      }
    } finally {
      articles.forEach((article, index) => {
        article.style.display = articleDisplays[index];
      });
    }
  }

  downloadBlob(pdf.output("blob"), `${fileName}.pdf`);
}
