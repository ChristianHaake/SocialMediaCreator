import datenschutz from "./datenschutz.md?raw";
import hilfe from "./hilfe.md?raw";
import impressum from "./impressum.md?raw";
import ueber from "./ueber.md?raw";
import lehrkraefte from "./lehrkraefte.md?raw";
import verantwortungsvoll from "./verantwortungsvoll.md?raw";
import nutzungsbedingungen from "./nutzungsbedingungen.md?raw";
import privacyEn from "./en/privacy.md?raw";
import helpEn from "./en/help.md?raw";
import legalEn from "./en/legal.md?raw";
import aboutEn from "./en/about.md?raw";
import educatorsEn from "./en/educators.md?raw";
import responsibleEn from "./en/responsible-use.md?raw";
import termsEn from "./en/terms.md?raw";

export const contentPages = {
  de: {
    "/hilfe": { title: "Hilfe", content: hilfe },
    "/ueber": { title: "Über das Projekt", content: ueber },
    "/lehrkraefte": {
      title: "Hinweise für Lehrkräfte",
      content: lehrkraefte,
    },
    "/verantwortungsvoll": {
      title: "Verantwortungsvoller Einsatz",
      content: verantwortungsvoll,
    },
    "/nutzungsbedingungen": {
      title: "Nutzungsbedingungen",
      content: nutzungsbedingungen,
    },
    "/datenschutz": { title: "Datenschutz", content: datenschutz },
    "/impressum": { title: "Impressum", content: impressum },
  },
  en: {
    "/hilfe": { title: "Help", content: helpEn },
    "/ueber": { title: "About the project", content: aboutEn },
    "/lehrkraefte": {
      title: "Information for educators",
      content: educatorsEn,
    },
    "/verantwortungsvoll": {
      title: "Responsible use",
      content: responsibleEn,
    },
    "/nutzungsbedingungen": { title: "Terms of use", content: termsEn },
    "/datenschutz": { title: "Privacy", content: privacyEn },
    "/impressum": { title: "Legal notice", content: legalEn },
  },
} as const;

export type ContentPath = keyof typeof contentPages.de;

export function isContentPath(pathname: string): pathname is ContentPath {
  return pathname in contentPages.de;
}
