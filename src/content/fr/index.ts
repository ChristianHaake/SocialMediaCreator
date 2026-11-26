import help from "./help.md?raw";
import about from "./about.md?raw";
import educators from "./educators.md?raw";
import responsible from "./responsible-use.md?raw";
import terms from "./terms.md?raw";
import privacy from "./privacy.md?raw";
import legal from "./legal.md?raw";

export default {
  "/hilfe": { title: "Aide", content: help },
  "/ueber": { title: "À propos du projet", content: about },
  "/lehrkraefte": { title: "Informations pour les enseignants", content: educators },
  "/verantwortungsvoll": { title: "Utilisation responsable", content: responsible },
  "/nutzungsbedingungen": { title: "Conditions d’utilisation", content: terms },
  "/datenschutz": { title: "Confidentialité", content: privacy },
  "/impressum": { title: "Mentions légales", content: legal },
} as const;
