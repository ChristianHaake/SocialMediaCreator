import datenschutz from "./content/datenschutz.md?raw";
import hilfe from "./content/hilfe.md?raw";
import impressum from "./content/impressum.md?raw";
import ueber from "./content/ueber.md?raw";
import privacyEn from "./content/en/privacy.md?raw";
import helpEn from "./content/en/help.md?raw";
import legalEn from "./content/en/legal.md?raw";
import aboutEn from "./content/en/about.md?raw";

export const contentPages = {
  de: {
    "/hilfe": { title: "Hilfe", content: hilfe },
    "/ueber": { title: "Über das Projekt", content: ueber },
    "/datenschutz": { title: "Datenschutz", content: datenschutz },
    "/impressum": { title: "Impressum", content: impressum },
  },
  en: {
    "/hilfe": { title: "Help", content: helpEn },
    "/ueber": { title: "About the project", content: aboutEn },
    "/datenschutz": { title: "Privacy", content: privacyEn },
    "/impressum": { title: "Legal notice", content: legalEn },
  },
} as const;

export type ContentPath = keyof typeof contentPages.de;

export function isContentPath(pathname: string): pathname is ContentPath {
  return pathname in contentPages.de;
}
