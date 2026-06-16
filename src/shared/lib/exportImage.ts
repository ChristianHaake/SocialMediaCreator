import { toCanvas } from "html-to-image";
import type { Locale, ModuleType } from "../../domain/types";
import { downloadBlob } from "./downloads";

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

function waitForImage(image: HTMLImageElement) {
  if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    image.addEventListener("load", () => resolve(), { once: true });
    image.addEventListener("error", () => reject(new Error("Image failed to load")), {
      once: true,
    });
  });
}

function waitForNextImageLoad(
  image: HTMLImageElement,
  src: string,
  timeoutMs = 3_000,
) {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      image.removeEventListener("load", onLoad);
      image.removeEventListener("error", onError);
      if (error) reject(error);
      else resolve();
    };
    const onLoad = () => finish();
    const onError = () => finish(new Error("Image failed to load"));
    const timeout = window.setTimeout(() => {
      if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
        finish();
      } else {
        finish(new Error("Image decode timed out"));
      }
    }, timeoutMs);
    image.addEventListener("load", onLoad);
    image.addEventListener("error", onError);
    image.src = src;
    if ("decode" in image) {
      image.decode().then(
        () => finish(),
        () => {
          if (
            image.complete &&
            image.naturalWidth > 0 &&
            image.naturalHeight > 0
          ) {
            finish();
          }
        },
      );
    }
  });
}

async function setImageSourceAndWait(image: HTMLImageElement, src: string) {
  await waitForNextImageLoad(image, src);
}

function waitForRenderFrame() {
  return new Promise<void>((resolve) => {
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => resolve());
      return;
    }
    globalThis.setTimeout(resolve, 0);
  });
}

function dataUrlToBlob(dataUrl: string) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/^data:([^;]+);base64$/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

export async function canvasToImageBlob(
  canvas: HTMLCanvasElement,
  type: "image/png" | "image/jpeg",
  quality?: number,
) {
  try {
    return await new Promise<Blob>((resolve, reject) => {
      let settled = false;
      const finish = (blob: Blob | null, error?: Error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        if (error) {
          reject(error);
          return;
        }
        if (!blob) {
          reject(new Error("Canvas image encoding failed."));
          return;
        }
        resolve(blob);
      };
      const timeout = window.setTimeout(() => {
        finish(null, new Error("Canvas image encoding timed out."));
      }, 5_000);
      canvas.toBlob(
        (encodedBlob) => finish(encodedBlob),
        type,
        quality,
      );
    });
  } catch (error) {
    if (type !== "image/png") throw error;
    try {
      const dataUrl = canvas.toDataURL("image/png");
      if (dataUrl.startsWith("data:")) {
        return dataUrlToBlob(dataUrl);
      }
    } catch {
      // Keep the original canvas encoding error if the fallback is unavailable.
    }
    throw error;
  }
}

async function inlineBlobImages(element: HTMLElement) {
  const images = Array.from(element.querySelectorAll<HTMLImageElement>("img"))
    .filter((image) => image.currentSrc.startsWith("blob:") || image.src.startsWith("blob:"));
  const restore: Array<() => void> = [];

  for (const image of images) {
    await waitForImage(image);
    const scale = Math.min(
      1,
      exportWidth / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context unavailable");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const previousSrc = image.getAttribute("src");
    const previousSrcset = image.getAttribute("srcset");
    const previousWidth = image.getAttribute("width");
    const previousHeight = image.getAttribute("height");
    
    image.removeAttribute("srcset");
    image.setAttribute("width", String(image.naturalWidth));
    image.setAttribute("height", String(image.naturalHeight));
    
    // We convert the scaled canvas to a JPEG data URL to save memory,
    // but we MUST convert it back to a blob URL. If we leave it as a data URL,
    // html-to-image will skip `embedImages` for it and will NOT wait for it to
    // decode in the cloned DOM, causing Safari to render it as completely blank.
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const blob = dataUrlToBlob(dataUrl);
    const optimizedBlobUrl = URL.createObjectURL(blob);
    
    await setImageSourceAndWait(image, optimizedBlobUrl);
    await waitForRenderFrame();
    
    restore.push(() => {
      URL.revokeObjectURL(optimizedBlobUrl);
      if (previousSrc === null) {
        image.removeAttribute("src");
      } else {
        image.setAttribute("src", previousSrc);
      }
      if (previousSrcset === null) {
        image.removeAttribute("srcset");
      } else {
        image.setAttribute("srcset", previousSrcset);
      }
      if (previousWidth === null) {
        image.removeAttribute("width");
      } else {
        image.setAttribute("width", previousWidth);
      }
      if (previousHeight === null) {
        image.removeAttribute("height");
      } else {
        image.setAttribute("height", previousHeight);
      }
    });
  }

  return () => {
    restore.reverse().forEach((restoreImage) => restoreImage());
  };
}

function getRenderOptions(element: HTMLElement) {
  return {
    backgroundColor: getExportBackground(element),
    cacheBust: false, // Must be false so html-to-image can fetch blob: URLs
    pixelRatio: exportWidth / Math.max(element.offsetWidth, 1),
  };
}

async function renderElementCanvas(element: HTMLElement) {
  await waitForRenderFrame();
  return toCanvas(element, getRenderOptions(element));
}

async function renderElementBlob(
  element: HTMLElement,
  format: ImageExportFormat,
) {
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
  const restoreBlobImages = await inlineBlobImages(element);
  try {
    const canvas = await renderElementCanvas(element);
    return canvasToImageBlob(
      canvas,
      format === "png" ? "image/png" : "image/jpeg",
      format === "jpg" ? 0.92 : undefined,
    );
  } finally {
    restoreBlobImages();
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
    renderedCanvas: HTMLCanvasElement,
    options: { fitSinglePage?: boolean; safeBreaks?: number[] } = {},
  ) {
    if (options.fitSinglePage) {
      if (pageCount > 0) pdf.addPage();
      pageCount += 1;
      const scale = Math.min(
        contentWidth / renderedCanvas.width,
        contentHeight / renderedCanvas.height,
      );
      pdf.addImage(
        renderedCanvas.toDataURL("image/jpeg", 0.92),
        "JPEG",
        margin + (contentWidth - renderedCanvas.width * scale) / 2,
        margin,
        renderedCanvas.width * scale,
        renderedCanvas.height * scale,
      );
      addExportFooter();
      return;
    }

    const pixelsPerPage = Math.floor(
      renderedCanvas.width * (contentHeight / contentWidth),
    );
    const cssToImageScale = renderedCanvas.width / Math.max(element.offsetWidth, 1);
    const safeBreaks = (options.safeBreaks ?? [])
      .map((position) => Math.round(position * cssToImageScale))
      .filter((position) => position > 0 && position < renderedCanvas.height)
      .sort((left, right) => left - right);

    for (const slice of calculatePageSlices(
      renderedCanvas.height,
      pixelsPerPage,
      safeBreaks,
    )) {
      const canvas = document.createElement("canvas");
      canvas.width = renderedCanvas.width;
      canvas.height = slice.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("PDF-Seite konnte nicht erstellt werden.");
      context.fillStyle = getExportBackground(element);
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        renderedCanvas,
        0,
        slice.y,
        renderedCanvas.width,
        slice.height,
        0,
        0,
        renderedCanvas.width,
        slice.height,
      );
      if (pageCount > 0) pdf.addPage();
      pageCount += 1;
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.92),
        "JPEG",
        margin,
        margin,
        contentWidth,
        contentWidth * (slice.height / renderedCanvas.width),
      );
      addExportFooter();
    }
  }

  async function renderCurrentState() {
    return renderElementCanvas(element);
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

  const restoreBlobImages = await inlineBlobImages(element);
  try {
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
              try {
                element.dataset.exportingSingleMedia = "true";
                await addRenderedPage(await renderCurrentState(), {
                  fitSinglePage: true,
                });
              } finally {
                delete element.dataset.exportingSingleMedia;
              }
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
  } finally {
    restoreBlobImages();
  }

  downloadBlob(pdf.output("blob"), `${fileName}.pdf`);
}
