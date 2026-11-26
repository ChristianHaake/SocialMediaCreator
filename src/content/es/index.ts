import help from "./help.md?raw";
import about from "./about.md?raw";
import educators from "./educators.md?raw";
import responsible from "./responsible-use.md?raw";
import terms from "./terms.md?raw";
import privacy from "./privacy.md?raw";
import legal from "./legal.md?raw";

export default {
  "/hilfe": { title: "Ayuda", content: help },
  "/ueber": { title: "Sobre el proyecto", content: about },
  "/lehrkraefte": { title: "Información para docentes", content: educators },
  "/verantwortungsvoll": { title: "Uso responsable", content: responsible },
  "/nutzungsbedingungen": { title: "Condiciones de uso", content: terms },
  "/datenschutz": { title: "Privacidad", content: privacy },
  "/impressum": { title: "Aviso legal", content: legal },
} as const;
