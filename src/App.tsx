import {
  Camera,
  Download,
  FileDown,
  FileUp,
  MessageSquareText,
  PenLine,
  RotateCcw,
} from "lucide-react";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppFooter } from "./components/AppFooter";
import { AppHeader } from "./components/AppHeader";
import { ContentPage } from "./components/ContentPage";
import { MessengerEditor } from "./components/MessengerEditor";
import { MessengerPreview } from "./components/MessengerPreview";
import { MicroblogEditor } from "./components/MicroblogEditor";
import { MicroblogPreview } from "./components/MicroblogPreview";
import { PhotoPostEditor } from "./components/PhotoPostEditor";
import { PhotoPostPreview } from "./components/PhotoPostPreview";
import { TeacherInfoDialog } from "./components/TeacherInfoDialog";
import { contentPages, isContentPath } from "./content";
import type {
  ImageState,
  MicroblogImages,
  ModuleType,
  PhotoPostImages,
} from "./types";
import {
  defaultMessenger,
  defaultMicroblog,
  defaultPhotoPost,
} from "./types";
import {
  downloadModuleConfig,
  readConfigFile,
} from "./utils/configFiles";
import {
  exportElementAsImage,
  type ImageExportFormat,
} from "./utils/exportImage";

type MobileView = "editor" | "preview";

const modules = [
  {
    id: "photoPost" as const,
    label: "Foto-Post",
    icon: Camera,
  },
  {
    id: "messenger" as const,
    label: "Messenger-Chat",
    icon: MessageSquareText,
  },
  {
    id: "microblog" as const,
    label: "Mikroblog",
    icon: PenLine,
  },
];

const moduleCopy: Record<
  ModuleType,
  { eyebrow: string; title: string; description: string; editorTitle: string }
> = {
  photoPost: {
    eyebrow: "Fiktiv. Lokal. Exportierbar.",
    title: "Erstelle deine Foto-Posts.",
    description:
      "Gestalte fiktive Beiträge und beobachte jede Änderung direkt in der Vorschau. Ohne Anmeldung und ohne Upload.",
    editorTitle: "Foto-Posts bearbeiten",
  },
  messenger: {
    eyebrow: "Dialoge nachvollziehbar gestalten.",
    title: "Baue deinen Messenger-Chat.",
    description:
      "Erstelle einen fiktiven Dialog, ordne Nachrichten und exportiere den vollständigen Verlauf direkt im Browser.",
    editorTitle: "Messenger-Chat bearbeiten",
  },
  microblog: {
    eyebrow: "Kurz. Klar. Kontextbezogen.",
    title: "Formuliere deine Mikroblog-Beiträge.",
    description:
      "Gestalte kurze fiktive Beiträge mit Profil, Zeitangaben und Reaktionen. Der Zeichenzähler informiert, ohne dich zu begrenzen.",
    editorTitle: "Mikroblog-Beiträge bearbeiten",
  },
};

function useImageCleanup(image: ImageState | null) {
  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url);
    },
    [image],
  );
}

function revokeImage(image: ImageState | null | undefined) {
  if (image) URL.revokeObjectURL(image.url);
}

function revokePhotoImages(images: PhotoPostImages) {
  Object.values(images).forEach(({ profileImage, postImage }) => {
    revokeImage(profileImage);
    revokeImage(postImage);
  });
}

function revokeMicroblogImages(images: MicroblogImages) {
  Object.values(images).forEach(revokeImage);
}

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>("photoPost");
  const [photoPost, setPhotoPost] = useState(defaultPhotoPost);
  const [messenger, setMessenger] = useState(defaultMessenger);
  const [microblog, setMicroblog] = useState(defaultMicroblog);
  const [photoImages, setPhotoImages] = useState<PhotoPostImages>({});
  const [messengerProfileImage, setMessengerProfileImage] =
    useState<ImageState | null>(null);
  const [microblogImages, setMicroblogImages] =
    useState<MicroblogImages>({});
  const [mobileView, setMobileView] = useState<MobileView>("editor");
  const [imageError, setImageError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [configStatus, setConfigStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [exporting, setExporting] = useState<ImageExportFormat | null>(null);
  const [teacherInfoOpen, setTeacherInfoOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const configInputRef = useRef<HTMLInputElement>(null);
  const moduleTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const photoImagesRef = useRef(photoImages);
  const microblogImagesRef = useRef(microblogImages);
  const pathname =
    window.location.pathname.length > 1
      ? window.location.pathname.replace(/\/+$/, "")
      : "/";

  useImageCleanup(messengerProfileImage);
  photoImagesRef.current = photoImages;
  microblogImagesRef.current = microblogImages;

  useEffect(
    () => () => {
      revokePhotoImages(photoImagesRef.current);
      revokeMicroblogImages(microblogImagesRef.current);
    },
    [],
  );

  const activeCopy = moduleCopy[activeModule];
  const activeHasImages =
    activeModule === "photoPost"
      ? Object.values(photoImages).some(
          ({ profileImage, postImage }) => profileImage || postImage,
        )
      : activeModule === "messenger"
        ? messengerProfileImage !== null
        : Object.values(microblogImages).some(Boolean);

  function selectModule(module: ModuleType) {
    setActiveModule(module);
    setMobileView("editor");
    setImageError(null);
    setExportError(null);
    setConfigStatus(null);
  }

  function handleModuleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % modules.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + modules.length) % modules.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = modules.length - 1;
    }

    if (nextIndex === null) return;

    event.preventDefault();
    selectModule(modules[nextIndex].id);
    moduleTabRefs.current[nextIndex]?.focus();
  }

  function isModuleChanged(module: ModuleType) {
    if (module === "photoPost") {
      return (
        JSON.stringify(photoPost) !== JSON.stringify(defaultPhotoPost) ||
        Object.keys(photoImages).length > 0
      );
    }

    if (module === "messenger") {
      return (
        JSON.stringify(messenger) !== JSON.stringify(defaultMessenger) ||
        messengerProfileImage !== null
      );
    }

    return (
      JSON.stringify(microblog) !== JSON.stringify(defaultMicroblog) ||
      Object.keys(microblogImages).length > 0
    );
  }

  function clearModuleImages(module: ModuleType) {
    if (module === "photoPost") {
      revokePhotoImages(photoImagesRef.current);
      setPhotoImages({});
    } else if (module === "messenger") {
      setMessengerProfileImage(null);
    } else {
      revokeMicroblogImages(microblogImagesRef.current);
      setMicroblogImages({});
    }
  }

  function setPhotoImage(
    postId: string,
    key: "profileImage" | "postImage",
    image: ImageState | null,
  ) {
    setPhotoImages((current) => {
      const previous = current[postId]?.[key];
      if (previous?.url !== image?.url) revokeImage(previous);

      const currentPostImages = current[postId] ?? {
        profileImage: null,
        postImage: null,
      };
      const nextPostImages = { ...currentPostImages, [key]: image };
      const next = { ...current, [postId]: nextPostImages };

      if (!nextPostImages.profileImage && !nextPostImages.postImage) {
        delete next[postId];
      }
      return next;
    });
  }

  function removePhotoPostImages(postId: string) {
    setPhotoImages((current) => {
      const postImages = current[postId];
      if (!postImages) return current;
      revokeImage(postImages.profileImage);
      revokeImage(postImages.postImage);
      const next = { ...current };
      delete next[postId];
      return next;
    });
  }

  function setMicroblogImage(postId: string, image: ImageState | null) {
    setMicroblogImages((current) => {
      const previous = current[postId];
      if (previous?.url !== image?.url) revokeImage(previous);
      const next = { ...current };
      if (image) next[postId] = image;
      else delete next[postId];
      return next;
    });
  }

  function removeMicroblogPostImage(postId: string) {
    setMicroblogImages((current) => {
      revokeImage(current[postId]);
      const next = { ...current };
      delete next[postId];
      return next;
    });
  }

  function resetActiveModule() {
    if (
      isModuleChanged(activeModule) &&
      !window.confirm("Aktuelle Eingaben wirklich zurücksetzen?")
    ) {
      return;
    }

    if (activeModule === "photoPost") {
      setPhotoPost(defaultPhotoPost);
    } else if (activeModule === "messenger") {
      setMessenger(defaultMessenger);
    } else {
      setMicroblog(defaultMicroblog);
    }
    clearModuleImages(activeModule);
    setImageError(null);
    setExportError(null);
    setConfigStatus(null);
  }

  function handleConfigDownload() {
    if (
      activeHasImages &&
      !window.confirm(
        "Bilder sind nicht Teil der Konfigurationsdatei und müssen nach dem Laden erneut ausgewählt werden. Trotzdem speichern?",
      )
    ) {
      return;
    }

    const data =
      activeModule === "photoPost"
        ? photoPost
        : activeModule === "messenger"
          ? messenger
          : microblog;
    downloadModuleConfig(activeModule, data);

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
        isModuleChanged(config.module) &&
        !window.confirm(
          "Beim Laden werden die Eingaben dieses Moduls ersetzt. Ausgewählte Bilder werden entfernt. Konfiguration laden?",
        )
      ) {
        return;
      }

      if (config.module === "photoPost") {
        setPhotoPost(config.data);
      } else if (config.module === "messenger") {
        setMessenger(config.data);
      } else {
        setMicroblog(config.data);
      }

      clearModuleImages(config.module);
      setActiveModule(config.module);
      setMobileView("editor");
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
      await exportElementAsImage(
        previewRef.current,
        format,
        activeModule === "photoPost"
          ? "social-media-creator-foto-post"
          : activeModule === "messenger"
            ? "social-media-creator-messenger-chat"
            : "social-media-creator-mikroblog",
      );
    } catch {
      setExportError(
        "Das Bild konnte nicht erstellt werden. Bitte versuche es erneut.",
      );
    } finally {
      setExporting(null);
    }
  }

  function renderEditor() {
    if (activeModule === "photoPost") {
      return (
        <PhotoPostEditor
          images={photoImages}
          onChange={setPhotoPost}
          onImageError={setImageError}
          onPostImageChange={(postId, image) =>
            setPhotoImage(postId, "postImage", image)
          }
          onPostRemoved={removePhotoPostImages}
          onProfileImageChange={(postId, image) =>
            setPhotoImage(postId, "profileImage", image)
          }
          value={photoPost}
        />
      );
    }

    if (activeModule === "messenger") {
      return (
        <MessengerEditor
          onChange={setMessenger}
          onImageError={setImageError}
          onProfileImageChange={setMessengerProfileImage}
          profileImage={messengerProfileImage}
          value={messenger}
        />
      );
    }

    return (
      <MicroblogEditor
        images={microblogImages}
        onChange={setMicroblog}
        onImageError={setImageError}
        onPostRemoved={removeMicroblogPostImage}
        onProfileImageChange={setMicroblogImage}
        value={microblog}
      />
    );
  }

  function renderPreview() {
    if (activeModule === "photoPost") {
      return (
        <PhotoPostPreview
          images={photoImages}
          ref={previewRef}
          value={photoPost}
        />
      );
    }

    if (activeModule === "messenger") {
      return (
        <MessengerPreview
          profileImage={messengerProfileImage}
          ref={previewRef}
          value={messenger}
        />
      );
    }

    return (
      <MicroblogPreview
        images={microblogImages}
        ref={previewRef}
        value={microblog}
      />
    );
  }

  return (
    <div className="app">
      <AppHeader onOpenTeacherInfo={() => setTeacherInfoOpen(true)} />

      {isContentPath(pathname) ? (
        <ContentPage {...contentPages[pathname]} />
      ) : pathname !== "/" ? (
        <ContentPage
          content="Die angeforderte Seite existiert nicht. Kehre zur App zurück oder verwende einen Link aus der Fußnavigation."
          title="Seite nicht gefunden"
        />
      ) : (
        <main>
          <section className="intro">
            <div>
              <span className="eyebrow">{activeCopy.eyebrow}</span>
              <h1>{activeCopy.title}</h1>
              <p>{activeCopy.description}</p>
            </div>
          </section>

          <nav
            aria-label="Format auswählen"
            className="module-tabs"
            role="tablist"
          >
            {modules.map(({ id, label, icon: Icon }, index) => (
              <button
                aria-controls="module-panel"
                aria-selected={id === activeModule}
                className={
                  id === activeModule
                    ? "module-tab module-tab--active"
                    : "module-tab"
                }
                id={`module-tab-${id}`}
                key={id}
                onClick={() => selectModule(id)}
                onKeyDown={(event) => handleModuleKeyDown(event, index)}
                ref={(element) => {
                  moduleTabRefs.current[index] = element;
                }}
                role="tab"
                tabIndex={id === activeModule ? 0 : -1}
                type="button"
              >
                <Icon aria-hidden="true" size={19} />
                <span>{label}</span>
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

          <section
            aria-labelledby={`module-tab-${activeModule}`}
            className="workspace"
            id="module-panel"
            role="tabpanel"
          >
            <div
              className={`editor-panel ${
                mobileView === "editor" ? "mobile-panel--active" : ""
              }`}
            >
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">Editor</span>
                  <h2>{activeCopy.editorTitle}</h2>
                </div>
                <button
                  className="icon-button"
                  onClick={resetActiveModule}
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

              {renderEditor()}
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

              <div
                className={`preview-stage preview-stage--${activeModule}`}
              >
                {renderPreview()}
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
      )}

      <AppFooter />
      <TeacherInfoDialog
        onClose={() => setTeacherInfoOpen(false)}
        open={teacherInfoOpen}
      />
    </div>
  );
}
