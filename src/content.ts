import datenschutz from "./content/datenschutz.md?raw";
import hilfe from "./content/hilfe.md?raw";
import impressum from "./content/impressum.md?raw";
import ueber from "./content/ueber.md?raw";

export const contentPages = {
  "/hilfe": { title: "Hilfe", content: hilfe },
  "/ueber": { title: "Über das Projekt", content: ueber },
  "/datenschutz": { title: "Datenschutz", content: datenschutz },
  "/impressum": { title: "Impressum", content: impressum },
} as const;

export type ContentPath = keyof typeof contentPages;

export function isContentPath(pathname: string): pathname is ContentPath {
  return pathname in contentPages;
}
