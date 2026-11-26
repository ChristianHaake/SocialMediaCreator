import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/base-and-editor.css";
import "./styles/previews.css";
import "./styles/content-and-dialogs.css";
import "./styles/support-page.css";
import "./styles/responsive.css";
import "./styles/ui-family.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
