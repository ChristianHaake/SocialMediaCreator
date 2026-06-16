import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/base-and-editor.css";
import "./styles/previews.css";
import "./styles/content-and-dialogs.css";
import "./styles/responsive.css";

// Auto-reload once when a new service worker takes control so the page
// always runs the latest code.  The guard prevents infinite reload loops.
if ("serviceWorker" in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

