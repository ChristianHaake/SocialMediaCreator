import help from "./help.md?raw";
import about from "./about.md?raw";
import educators from "./educators.md?raw";
import responsible from "./responsible-use.md?raw";
import terms from "./terms.md?raw";
import privacy from "./privacy.md?raw";
import legal from "./legal.md?raw";

export default {
  "/hilfe": { title: "Help", content: help },
  "/ueber": { title: "Over het project", content: about },
  "/lehrkraefte": { title: "Informatie voor docenten", content: educators },
  "/verantwortungsvoll": { title: "Verantwoord gebruik", content: responsible },
  "/nutzungsbedingungen": { title: "Gebruiksvoorwaarden", content: terms },
  "/datenschutz": { title: "Privacy", content: privacy },
  "/impressum": { title: "Juridische informatie", content: legal },
} as const;
