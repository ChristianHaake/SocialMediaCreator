import { toJpeg, toPng } from "html-to-image";

export type ImageExportFormat = "png" | "jpg";

const exportWidth = 1080;

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}

export async function exportElementAsImage(
  element: HTMLElement,
  format: ImageExportFormat,
  fileName = "mockup-studio-foto-post",
) {
  const scale = exportWidth / element.offsetWidth;
  const commonOptions = {
    backgroundColor: "#ffffff",
    cacheBust: true,
    pixelRatio: scale,
  };

  const dataUrl =
    format === "png"
      ? await toPng(element, commonOptions)
      : await toJpeg(element, { ...commonOptions, quality: 0.92 });

  downloadDataUrl(dataUrl, `${fileName}.${format}`);
}
