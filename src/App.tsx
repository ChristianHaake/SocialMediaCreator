import {
  Camera,
  Check,
  Download,
  FileDown,
  FileUp,
  Image as ImageIcon,
  MessageSquareText,
  RotateCcw,
} from "lucide-react";
import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { PhotoPostEditor } from "./components/PhotoPostEditor";
import { PhotoPostPreview } from "./components/PhotoPostPreview";
import type { ImageState } from "./types";
import { defaultPhotoPost } from "./types";
import {
  downloadPhotoPostConfig,
  readConfigFile,
} from "./utils/configFiles";
import {
  exportElementAsImage,
  type ImageExportFormat,
} from "./utils/exportImage";

type MobileView = "editor" | "preview";

const modules = [
  { label: "Foto-Post", icon: Camera, available: true },
  { label: "Messenger-Chat", icon: MessageSquareText, available: false },
  { label: "Mikroblog", icon: ImageIcon, available: false },
];

export function App() {
  const [photoPost, setPhotoPost] = useState(defaultPhotoPost);
  const [profileImage, setProfileImage] = useState<ImageState | null>(null);
  const [postImage, setPostImage] = useState<ImageState | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>("editor");
  const [imageError, setImageError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [configStatus, setConfigStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [exporting, setExporting] = useState<ImageExportFormat | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const configInputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (profileImage) URL.revokeObjectURL(profileImage.url);
    },
    [profileImage],
  );

  useEffect(
    () => () => {
      if (postImage) URL.revokeObjectURL(postImage.url);
    },
    [postImage],
  );

  function replaceImage(
    next: ImageState | null,
    setter: (image: ImageState | null) => void,
  ) {
    setter(next);
  }

  function resetPhotoPost() {
    const changed =
      JSON.stringify(photoPost) !== JSON.stringify(defaultPhotoPost) ||
      profileImage !== null ||
      postImage !== null;

    if (changed && !window.confirm("Aktuelle Eingaben wirklich zurücksetzen?")) {
      return;
    }

    replaceImage(null, setProfileImage);
    replaceImage(null, setPostImage);
    setPhotoPost(defaultPhotoPost);
    setImageError(null);
    setExportError(null);
    setConfigStatus(null);
  }

  function hasChangedContent() {
    return (
      JSON.stringify(photoPost) !== JSON.stringify(defaultPhotoPost) ||
      profileImage !== null ||
      postImage !== null
    );
  }

  function handleConfigDownload() {
    if (
      (profileImage || postImage) &&
      !window.confirm(
        "Bilder sind nicht Teil der Konfigurationsdatei und müssen nach dem Laden erneut ausgewählt werden. Trotzdem speichern?",
      )
    ) {
      return;
    }

    downloadPhotoPostConfig(photoPost);
    setConfigStatus({
      type: "success",
      message: "Konfiguration ohne Bilder gespeichert.",
    });
  }

  async function handleConfigUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setConfigStatus(null);

    try {
      const config = await readConfigFile(file);
      if (
        hasChangedContent() &&
        !window.confirm(
          "Beim Laden werden die aktuellen Eingaben ersetzt. Ausgewählte Bilder werden entfernt. Konfiguration laden?",
        )
      ) {
        return;
      }

      setPhotoPost(config.data);
      replaceImage(null, setProfileImage);
      replaceImage(null, setPostImage);
      setImageError(null);
      setConfigStatus({
        type: "success",
        message:
          "Konfiguration geladen. Bilder müssen erneut ausgewählt werden.",
      });
    } catch (error) {
      setConfigStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Die Konfiguration konnte nicht geladen werden.",
      });
    }
  }

  async function handleImageExport(format: ImageExportFormat) {
    if (!previewRef.current || exporting) return;

    setExportError(null);
    setExporting(format);
    try {
      await exportElementAsImage(previewRef.current, format);
    } catch {
      setExportError(
        "Das Bild konnte nicht erstellt werden. Bitte versuche es erneut.",
      );
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <a className="brand" href="/">
          <span className="brand__mark">
            <ImageIcon aria-hidden="true" size={21} />
          </span>
          <span>
            <strong>Mockup Studio</strong>
            <small>Werkstatt für digitale Formate</small>
          </span>
        </a>
        <div className="header-meta">
          <span className="privacy-badge">
            <Check aria-hidden="true" size={15} />
            Alles bleibt lokal
          </span>
        </div>
      </header>

      <main>
        <section className="intro">
          <div>
            <span className="eyebrow">Fiktiv. Lokal. Exportierbar.</span>
            <h1>Erstelle deinen Foto-Post.</h1>
            <p>
              Gestalte einen fiktiven Beitrag und beobachte jede Änderung direkt
              in der Vorschau. Ohne Anmeldung und ohne Upload.
            </p>
          </div>
        </section>

        <nav aria-label="Format auswählen" className="module-tabs">
          {modules.map(({ label, icon: Icon, available }) => (
            <button
              aria-current={available ? "page" : undefined}
              className={available ? "module-tab module-tab--active" : "module-tab"}
              disabled={!available}
              key={label}
              type="button"
            >
              <Icon aria-hidden="true" size={19} />
              <span>{label}</span>
              {!available && <small>Folgt</small>}
            </button>
          ))}
        </nav>

        <div aria-label="Ansicht auswählen" className="mobile-view-toggle">
          <button
            aria-pressed={mobileView === "editor"}
            onClick={() => setMobileView("editor")}
            type="button"
          >
            Bearbeiten
          </button>
          <button
            aria-pressed={mobileView === "preview"}
            onClick={() => setMobileView("preview")}
            type="button"
          >
            Vorschau
          </button>
        </div>

        <section className="workspace">
          <div
            className={`editor-panel ${
              mobileView === "editor" ? "mobile-panel--active" : ""
            }`}
          >
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Editor</span>
                <h2>Foto-Post bearbeiten</h2>
              </div>
              <button
                className="icon-button"
                onClick={resetPhotoPost}
                title="Zurücksetzen"
                type="button"
              >
                <RotateCcw aria-hidden="true" size={18} />
                <span className="visually-hidden">Zurücksetzen</span>
              </button>
            </div>

            {imageError && (
              <p className="status status--error" role="alert">
                {imageError}
              </p>
            )}

            <PhotoPostEditor
              onChange={setPhotoPost}
              onImageError={setImageError}
              onPostImageChange={(image) =>
                replaceImage(image, setPostImage)
              }
              onProfileImageChange={(image) =>
                replaceImage(image, setProfileImage)
              }
              postImage={postImage}
              profileImage={profileImage}
              value={photoPost}
            />
          </div>

          <div
            className={`preview-panel ${
              mobileView === "preview" ? "mobile-panel--active" : ""
            }`}
          >
            <div className="preview-panel__header">
              <div>
                <span className="panel-kicker">Live-Vorschau</span>
                <p>Wird lokal in deinem Browser gerendert</p>
              </div>
              <span className="live-indicator">
                <span />
                Live
              </span>
            </div>

            <div className="preview-stage">
              <PhotoPostPreview
                postImage={postImage}
                profileImage={profileImage}
                ref={previewRef}
                value={photoPost}
              />
            </div>

            <div className="action-bar">
              <div className="action-group">
                <span>Projekt</span>
                <button
                  className="button button--secondary"
                  onClick={() => configInputRef.current?.click()}
                  type="button"
                >
                  <FileUp aria-hidden="true" size={17} />
                  Laden
                </button>
                <input
                  accept=".json,application/json"
                  className="visually-hidden"
                  onChange={handleConfigUpload}
                  ref={configInputRef}
                  type="file"
                />
                <button
                  className="button button--secondary"
                  onClick={handleConfigDownload}
                  type="button"
                >
                  <FileDown aria-hidden="true" size={17} />
                  Speichern
                </button>
              </div>
              <div className="action-group">
                <span>Bild</span>
                <button
                  className="button button--secondary"
                  disabled={exporting !== null}
                  onClick={() => handleImageExport("jpg")}
                  type="button"
                >
                  <Download aria-hidden="true" size={17} />
                  {exporting === "jpg" ? "Erstelle..." : "JPG"}
                </button>
                <button
                  className="button button--primary"
                  disabled={exporting !== null}
                  onClick={() => handleImageExport("png")}
                  type="button"
                >
                  <Download aria-hidden="true" size={17} />
                  {exporting === "png" ? "Erstelle..." : "PNG"}
                </button>
              </div>
            </div>
            {exportError && (
              <p className="status status--error" role="alert">
                {exportError}
              </p>
            )}
            {configStatus && (
              <p
                className={`status status--${configStatus.type}`}
                role={configStatus.type === "error" ? "alert" : "status"}
              >
                {configStatus.message}
              </p>
            )}
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <span>Mockup Studio · Daten bleiben auf deinem Gerät</span>
        <span>Version 0.1 · Foto-Post</span>
      </footer>
    </div>
  );
}
