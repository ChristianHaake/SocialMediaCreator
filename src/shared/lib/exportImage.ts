import { toCanvas } from "html-to-image";
import type { Locale, ModuleType } from "../../domain/types";
import { downloadBlob } from "./downloads";
import { exportBadgeText } from "./exportLabels";
import { addImageMarker } from "./imageMarkers";
export {
  addImageMarker,
  maxVerificationImageSize,
  verifyImageMarker,
} from "./imageMarkers";
export { exportBadgeText } from "./exportLabels";
export type { ImageMarker, VerificationResult } from "./imageMarkers";

export type ImageExportFormat = "png" | "jpg";
export type ExportFormat = ImageExportFormat | "pdf";

const exportWidth = 1080;

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

function getExportBackground(element: HTMLElement) {
  if (element.classList.contains("theme-dark")) return "#000000";
  if (element.classList.contains("theme-dim")) return "#15202b";

  const computed = getComputedStyle(element).backgroundColor;
  return computed && computed !== "rgba(0, 0, 0, 0)"
    ? computed
    : "#ffffff";
}

function getExportFrameBackground(module: ModuleType) {
  if (module === "messenger") return "#e8edea";
  if (module === "microblog") return "#efedf4";
  return "#eef1f5";
}

const isImageReady = (image: HTMLImageElement) =>
  image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;

function waitForImageWithTimeout(image: HTMLImageElement, timeoutMs = 3_000) {
  if (isImageReady(image)) {
    return Promise.resolve();
  }

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
      finish(
        isImageReady(image) ? undefined : new Error("Image decode timed out"),
      );
    }, timeoutMs);
    image.addEventListener("load", onLoad);
    image.addEventListener("error", onError);
    if ("decode" in image && typeof image.decode === "function") {
      image.decode().then(
        () => finish(),
        () =>
          finish(
            isImageReady(image) ? undefined : new Error("Image failed to decode"),
          ),
      );
    }
  });
}

function waitForRenderFrame() {
  return new Promise<void>((resolve) => {
    let settled = false;
    const fallback = globalThis.setTimeout(() => finish(), 50);
    function finish() {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(fallback);
      resolve();
    }
    // requestAnimationFrame is paused while the document is hidden (background
    // tab, unfocused PWA). rAF-only here would hang the entire export — it never
    // fires, so "Creating…" sticks forever. Race it against a timer that still
    // runs while hidden; rAF wins when visible, the timer rescues when not.
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => finish());
    }
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

function getImageSource(image: HTMLImageElement) {
  return image.getAttribute("src") || image.currentSrc || image.src;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Image could not be converted to a data URL."));
      }
    };
    reader.onerror = () => reject(new Error("Image could not be read."));
    reader.readAsDataURL(blob);
  });
}

async function inlineImageSource(source: string) {
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Image request failed with status ${response.status}.`);
  }
  return blobToDataUrl(await response.blob());
}

async function prepareExportImages(element: HTMLElement) {
  const images = Array.from(element.querySelectorAll<HTMLImageElement>("img"));

  // Inline images before html-to-image serializes the frame. Safari/WebKit can
  // render the surrounding foreignObject while dropping blob: image sources,
  // producing exports with blank media areas. Decoding the inlined data URL here
  // makes the frame self-contained before html-to-image clones it again.
  // Best-effort and isolated per image: a single failed image must never abort
  // the whole export.
  await Promise.all(
    images.map(async (image) => {
      image.removeAttribute("srcset");
      const source = getImageSource(image);
      if (!source) return;
      try {
        if (!source.startsWith("data:")) {
          image.src = await inlineImageSource(source);
        }
        await waitForImageWithTimeout(image);
      } catch (error) {
        console.warn("[Export] Skipped an image that failed to load", error);
      }
    }),
  );
}

function getExportContentWidth(source: HTMLElement) {
  const content =
    source.querySelector<HTMLElement>(
      ".photo-feed, .messenger-preview, .microblog-feed",
    ) ?? source;
  const measured = content.getBoundingClientRect().width || content.offsetWidth;
  return Math.max(280, Math.ceil(measured || 430));
}

function getExportFrameClass(module: ModuleType) {
  return `export-frame--${module}`;
}

async function createExportFrame(
  source: HTMLElement,
  module: ModuleType,
  mode: "image" | "pdf",
) {
  const frame = document.createElement("div");
  const content = source.cloneNode(true) as HTMLElement;
  const contentWidth = getExportContentWidth(source);
  const horizontalPadding = 48;
  const frameWidth = contentWidth + horizontalPadding * 2;

  frame.className = `export-frame ${getExportFrameClass(module)}`;
  frame.dataset.exportFrame = module;
  if (mode === "image") {
    frame.dataset.imageExporting = "true";
  } else {
    frame.dataset.exporting = "true";
  }

  Object.assign(frame.style, {
    position: "fixed",
    left: "0",
    top: "0",
    zIndex: "-1",
    width: `${frameWidth}px`,
    boxSizing: "border-box",
    display: "block",
    padding: `${horizontalPadding}px`,
    backgroundColor: getExportFrameBackground(module),
    overflow: "visible",
    pointerEvents: "none",
  });
  Object.assign(content.style, {
    width: `${contentWidth}px`,
    maxWidth: "none",
    margin: "0 auto",
  });

  frame.append(content);
  document.body.append(frame);
  try {
    await prepareExportImages(frame);
    await waitForRenderFrame();
  } catch (error) {
    // Never leave the offscreen frame attached if setup fails — a leaked
    // position:fixed export-frame would pile up visibly on every retry.
    frame.remove();
    throw error;
  }

  return {
    content,
    frame,
    cleanup: () => frame.remove(),
  };
}

function getRenderOptions(element: HTMLElement) {
  const renderWidth = element.offsetWidth || Number.parseFloat(element.style.width) || 1;
  return {
    backgroundColor: getExportBackground(element),
    cacheBust: false,
    pixelRatio: exportWidth / renderWidth,
  };
}

// html-to-image resolves its rendered image inside requestAnimationFrame
// (its util.js createImage). rAF is paused while the document is hidden, so
// toCanvas never resolves and the whole export hangs with no error whenever the
// tab/PWA is not focused. Route rAF through a timer while hidden, only for the
// duration of the render, then restore it.
async function withRenderFrameFallback<T>(run: () => Promise<T>): Promise<T> {
  if (typeof window === "undefined" || !window.requestAnimationFrame) {
    return run();
  }
  const original = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = ((callback: FrameRequestCallback): number => {
    if (typeof document !== "undefined" && document.hidden) {
      return window.setTimeout(
        () => callback(performance.now()),
        16,
      ) as unknown as number;
    }
    return original(callback);
  }) as typeof window.requestAnimationFrame;
  try {
    return await run();
  } finally {
    window.requestAnimationFrame = original;
  }
}

async function renderElementCanvas(element: HTMLElement) {
  await waitForRenderFrame();
  return withRenderFrameFallback(() =>
    toCanvas(element, getRenderOptions(element)),
  );
}

async function renderElementBlob(
  element: HTMLElement,
  format: ImageExportFormat,
  module: ModuleType,
) {
  const { frame, cleanup } = await createExportFrame(element, module, "image");
  try {
    const canvas = await renderElementCanvas(frame);
    return canvasToImageBlob(
      canvas,
      format === "png" ? "image/png" : "image/jpeg",
      format === "jpg" ? 0.92 : undefined,
    );
  } finally {
    cleanup();
  }
}

export async function exportElementAsImage(
  element: HTMLElement,
  format: ImageExportFormat,
  fileName = "social-media-creator-foto-post",
  module: ModuleType = "photoPost",
) {
  const blob = await renderElementBlob(element, format, module);
  const markedBlob = await addImageMarker(blob, module);
  downloadBlob(markedBlob, `${fileName}.${format}`);
}

export async function exportElementAsPdf(
  element: HTMLElement,
  fileName: string,
  module: ModuleType,
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
  const { frame, cleanup } = await createExportFrame(element, module, "pdf");

  function getRenderCssWidth() {
    return frame.offsetWidth || Number.parseFloat(frame.style.width) || 1;
  }

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
    const cssToImageScale = renderedCanvas.width / getRenderCssWidth();
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
      context.fillStyle = getExportBackground(frame);
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
    return renderElementCanvas(frame);
  }

  function safeBreaksFor(selector: string) {
    const rootTop = frame.getBoundingClientRect().top;
    return Array.from(frame.querySelectorAll<HTMLElement>(selector)).map(
      (item) => item.getBoundingClientRect().bottom - rootTop,
    );
  }

  const articles = Array.from(
    frame.querySelectorAll<HTMLElement>(".photo-post, .microblog-preview"),
  );

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
                frame.dataset.exportingSingleMedia = "true";
                await addRenderedPage(await renderCurrentState(), {
                  fitSinglePage: true,
                });
              } finally {
                delete frame.dataset.exportingSingleMedia;
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
    cleanup();
  }

  downloadBlob(pdf.output("blob"), `${fileName}.pdf`);
}
