import {
  Camera,
  Download,
  FileDown,
  FileUp,
  MessageSquareText,
  PenLine,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import {
  type KeyboardEvent,
  lazy,
  useRef,
  useState,
  Suspense,
} from "react";
import { AppFooter } from "./components/AppFooter";
import { AppHeader } from "./components/AppHeader";
import { EducationNotice } from "./components/EducationNotice";
import { ExportNoticeDialog } from "./components/ExportNoticeDialog";
import { MessengerEditor } from "../features/messenger/MessengerEditor";
import { MessengerPreview } from "../features/messenger/MessengerPreview";
import { MicroblogEditor } from "../features/microblog/MicroblogEditor";
import { MicroblogPreview } from "../features/microblog/MicroblogPreview";
import { PhotoPostEditor } from "../features/photo-post/PhotoPostEditor";
import { PhotoPostPreview } from "../features/photo-post/PhotoPostPreview";
import { TeacherInfoDialog } from "./components/TeacherInfoDialog";
import { LocaleProvider, useTranslation } from "../i18n";
import type { ModuleType } from "../domain/types";
import {
  getDefaultMessenger,
  getDefaultMicroblog,
  getDefaultPhotoPost,
} from "../domain/types";
import { useProjectImages } from "./useProjectImages";
import { useProjectStorage } from "./useProjectStorage";
import { usePwaUpdate } from "./usePwaUpdate";
import { useSessionPersistence } from "./useSessionPersistence";
import { useExportController } from "./useExportController";

type MobileView = "editor" | "preview";

const ContentRoute = lazy(() =>
  import("./components/ContentRoute").then(({ ContentRoute }) => ({
    default: ContentRoute,
  })),
);
const VerificationPage = lazy(() =>
  import("../features/verification/VerificationPage").then(
    ({ VerificationPage }) => ({ default: VerificationPage }),
  ),
);

const orientationStorageKey = "social-media-creator-orientation-dismissed";

function readOrientationDismissed() {
  try {
    return window.localStorage.getItem(orientationStorageKey) === "true";
  } catch {
    return false;
  }
}

function AppContent() {
  const { locale, setLocale, t } = useTranslation();
  const initialPhotoPost = useRef(getDefaultPhotoPost(locale));
  const initialMessenger = useRef(getDefaultMessenger(locale));
  const initialMicroblog = useRef(getDefaultMicroblog(locale));
  const [activeModule, setActiveModule] = useState<ModuleType>("photoPost");
  const [photoPost, setPhotoPost] = useState(initialPhotoPost.current);
  const [messenger, setMessenger] = useState(initialMessenger.current);
  const [microblog, setMicroblog] = useState(initialMicroblog.current);
  const {
    photoImages,
    messengerImages,
    microblogImages,
    clearModuleImages,
    replaceModuleImages,
    setPhotoImage,
    setPhotoMapImage,
    removePhotoImages,
    removePhotoPostImages,
    setMessengerImage,
    setMicroblogProfileImage,
    setMicroblogCommentImage,
    removeMicroblogImages,
    removeMicroblogPostImage,
  } = useProjectImages();
  const [mobileView, setMobileView] = useState<MobileView>("editor");
  const [imageError, setImageError] = useState<string | null>(null);
  const [teacherInfoOpen, setTeacherInfoOpen] = useState(false);
  const [orientationDismissed, setOrientationDismissed] = useState(
    readOrientationDismissed,
  );
  const previewRef = useRef<HTMLDivElement>(null);
  const configInputRef = useRef<HTMLInputElement>(null);
  const {
    refreshApp,
    resetAppVersion,
    updateAvailable,
  } = usePwaUpdate();

  const { cancelPendingSessionRestore, clearSession } = useSessionPersistence({
    locale,
    activeModule,
    setActiveModule,
    photoPost,
    messenger,
    microblog,
    setPhotoPost,
    setMessenger,
    setMicroblog,
    initialPhotoPost,
    initialMessenger,
    initialMicroblog,
    photoImages,
    messengerImages,
    microblogImages,
    replaceModuleImages,
  });

  const {
    projectOperation,
    configStatus,
    setConfigStatus,
    handleProjectDownload,
    handleProjectUpload,
  } = useProjectStorage({
    locale,
    setLocale,
    t,
    activeModule,
    setActiveModule,
    setMobileView,
    setImageError,
    isModuleChanged,
    photoPost,
    messenger,
    microblog,
    setPhotoPost,
    setMessenger,
    setMicroblog,
    initialPhotoPost,
    initialMessenger,
    initialMicroblog,
    photoImages,
    messengerImages,
    microblogImages,
    replaceModuleImages,
    clearModuleImages,
    cancelPendingSessionRestore,
  });

  const {
    exporting,
    exportError,
    setExportError,
    pendingExport,
    exportConsentRequired,
    requestExport,
    confirmExport,
    cancelExport,
  } = useExportController({
    previewRef,
    activeModule,
    locale,
    t,
  });
  const moduleTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pathname =
    window.location.pathname.length > 1
      ? window.location.pathname.replace(/\/+$/, "")
      : "/";
  const modules = [
    { id: "photoPost" as const, label: t("module.photo"), icon: Camera },
    {
      id: "messenger" as const,
      label: t("module.messenger"),
      icon: MessageSquareText,
    },
    { id: "microblog" as const, label: t("module.microblog"), icon: PenLine },
  ];
  const moduleCopy: Record<
    ModuleType,
    { eyebrow: string; title: string; description: string; editorTitle: string }
  > = {
    photoPost: {
      eyebrow: t("photo.eyebrow"),
      title: t("photo.title"),
      description: t("photo.description"),
      editorTitle: t("photo.editorTitle"),
    },
    messenger: {
      eyebrow: t("messenger.eyebrow"),
      title: t("messenger.title"),
      description: t("messenger.description"),
      editorTitle: t("messenger.editorTitle"),
    },
    microblog: {
      eyebrow: t("microblog.eyebrow"),
      title: t("microblog.title"),
      description: t("microblog.description"),
      editorTitle: t("microblog.editorTitle"),
    },
  };

  const activeCopy = moduleCopy[activeModule];
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
        JSON.stringify(photoPost) !== JSON.stringify(initialPhotoPost.current) ||
        Object.keys(photoImages).length > 0
      );
    }

    if (module === "messenger") {
      return (
        JSON.stringify(messenger) !== JSON.stringify(initialMessenger.current) ||
        Object.keys(messengerImages).length > 0
      );
    }

    return (
      JSON.stringify(microblog) !== JSON.stringify(initialMicroblog.current) ||
      Object.keys(microblogImages).length > 0
    );
  }

  function resetActiveModule() {
    if (
      isModuleChanged(activeModule) &&
      !window.confirm(t("app.resetConfirm"))
    ) {
      return;
    }

    if (activeModule === "photoPost") {
      const next = getDefaultPhotoPost(locale);
      initialPhotoPost.current = next;
      setPhotoPost(next);
    } else if (activeModule === "messenger") {
      const next = getDefaultMessenger(locale);
      initialMessenger.current = next;
      setMessenger(next);
    } else {
      const next = getDefaultMicroblog(locale);
      initialMicroblog.current = next;
      setMicroblog(next);
    }
    clearModuleImages(activeModule);
    setImageError(null);
    setExportError(null);
    setConfigStatus(null);
  }

  async function clearSavedData() {
    if (!window.confirm(t("app.clearSavedConfirm"))) return;
    await clearSession();
    const nextPhoto = getDefaultPhotoPost(locale);
    initialPhotoPost.current = nextPhoto;
    setPhotoPost(nextPhoto);
    const nextMessenger = getDefaultMessenger(locale);
    initialMessenger.current = nextMessenger;
    setMessenger(nextMessenger);
    const nextMicroblog = getDefaultMicroblog(locale);
    initialMicroblog.current = nextMicroblog;
    setMicroblog(nextMicroblog);
    clearModuleImages("photoPost");
    clearModuleImages("messenger");
    clearModuleImages("microblog");
    setImageError(null);
    setExportError(null);
    setConfigStatus({ type: "success", message: t("app.clearedSaved") });
  }

  function dismissOrientation() {
    setOrientationDismissed(true);
    try {
      window.localStorage.setItem(orientationStorageKey, "true");
    } catch {
      // The hint is dismissible for this render even if persistence is blocked.
    }
  }


  function renderEditor() {
    if (activeModule === "photoPost") {
      return (
        <PhotoPostEditor
          images={photoImages}
          onChange={setPhotoPost}
          onCommentImageChange={(postId, itemId, image) =>
            setPhotoMapImage(postId, "commentImages", itemId, image)
          }
          onImageError={setImageError}
          onImagesRemoved={removePhotoImages}
          onMediaImageChange={(postId, mediaId, image) =>
            setPhotoMapImage(postId, "media", mediaId, image)
          }
          onPostRemoved={removePhotoPostImages}
          onProfileImageChange={(postId, image) =>
            setPhotoImage(postId, image)
          }
          value={photoPost}
        />
      );
    }

    if (activeModule === "messenger") {
      return (
        <MessengerEditor
          images={messengerImages}
          onChange={setMessenger}
          onImageError={setImageError}
          onProfileImageChange={setMessengerImage}
          value={messenger}
        />
      );
    }

    return (
      <MicroblogEditor
        images={microblogImages}
        onChange={setMicroblog}
        onCommentImageChange={setMicroblogCommentImage}
        onImageError={setImageError}
        onImagesRemoved={removeMicroblogImages}
        onPostRemoved={removeMicroblogPostImage}
        onProfileImageChange={setMicroblogProfileImage}
        value={microblog}
      />
    );
  }

  function renderPreview() {
    if (activeModule === "photoPost") {
      return (
        <PhotoPostPreview
          images={photoImages}
          onActiveMediaChange={(postId, mediaId) =>
            setPhotoPost((current) => ({
              ...current,
              posts: current.posts.map((post) =>
                post.id === postId
                  ? { ...post, activeMediaId: mediaId }
                  : post,
              ),
            }))
          }
          onPostSelect={(activePostId) => {
            setPhotoPost((current) => ({ ...current, activePostId }));
            setMobileView("editor");
          }}
          value={photoPost}
        />
      );
    }

    if (activeModule === "messenger") {
      return (
        <MessengerPreview
          images={messengerImages}
          value={messenger}
        />
      );
    }

    return (
      <MicroblogPreview
        images={microblogImages}
        onPostSelect={(activePostId) => {
          setMicroblog((current) => ({ ...current, activePostId }));
          setMobileView("editor");
        }}
        value={microblog}
      />
    );
  }

  return (
    <div className="app">
      <AppHeader onOpenTeacherInfo={() => setTeacherInfoOpen(true)} />
      {pathname === "/" && <EducationNotice />}
      {updateAvailable && (
        <div className="status status--success status--action" role="status">
          <span>{t("app.updateAvailable")}</span>
          <button
            className="button button--secondary"
            onClick={refreshApp}
            type="button"
          >
            {t("app.updateNow")}
          </button>
        </div>
      )}

      {pathname === "/verifizieren" ? (
        <Suspense fallback={null}>
          <VerificationPage />
        </Suspense>
      ) : pathname !== "/" ? (
        <Suspense fallback={null}>
          <ContentRoute pathname={pathname} />
        </Suspense>
      ) : (
        <main>
          <section className="intro">
            <div>
              <span className="eyebrow">{activeCopy.eyebrow}</span>
              <h1>{activeCopy.title}</h1>
              <p>{activeCopy.description}</p>
            </div>
          </section>

          {!orientationDismissed && (
            <aside
              aria-label={t("orientation.label")}
              className="orientation-strip"
            >
              <strong>{t("orientation.title")}</strong>
              <ol>
                <li>
                  <span>1</span>
                  {t("orientation.step1")}
                </li>
                <li>
                  <span>2</span>
                  {t("orientation.step2")}
                </li>
                <li>
                  <span>3</span>
                  {t("orientation.step3")}
                </li>
                <li>
                  <span>4</span>
                  {t("orientation.step4")}
                </li>
              </ol>
              <button
                aria-label={t("orientation.dismiss")}
                className="orientation-strip__close"
                onClick={dismissOrientation}
                type="button"
              >
                <X aria-hidden="true" size={22} />
              </button>
            </aside>
          )}

          <nav
            aria-label={t("app.format")}
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

          <div aria-label={t("app.view")} className="mobile-view-toggle">
            <button
              aria-pressed={mobileView === "editor"}
              onClick={() => setMobileView("editor")}
              type="button"
            >
              {t("app.edit")}
            </button>
            <button
              aria-pressed={mobileView === "preview"}
              onClick={() => setMobileView("preview")}
              type="button"
            >
              {t("app.preview")}
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
                  <span className="panel-kicker">{t("app.editor")}</span>
                  <h2>{activeCopy.editorTitle}</h2>
                </div>
                <button
                  className="icon-button"
                  onClick={resetActiveModule}
                  title={t("app.reset")}
                  type="button"
                >
                  <RotateCcw aria-hidden="true" size={18} />
                  <span className="visually-hidden">{t("app.reset")}</span>
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
                  <span className="panel-kicker">{t("app.livePreview")}</span>
                  <p>{t("app.localRender")}</p>
                </div>
                <span className="live-indicator">
                  <span />
                  {t("app.live")}
                </span>
              </div>

              <div
                className={`preview-stage preview-stage--${activeModule}`}
              >
                <div className="export-wrapper" ref={previewRef}>
                  {renderPreview()}
                </div>
              </div>

              <div className="action-bar">
                <div className="action-group">
                  <span>{t("app.project")}</span>
                  <button
                    className="button button--secondary"
                    disabled={projectOperation !== null}
                    onClick={() => configInputRef.current?.click()}
                    type="button"
                  >
                    <FileUp aria-hidden="true" size={17} />
                    {projectOperation === "loading"
                      ? t("app.loading")
                      : t("app.load")}
                  </button>
                  <input
                    accept=".smc,.json,application/zip,application/json"
                    className="visually-hidden"
                    onChange={handleProjectUpload}
                    ref={configInputRef}
                    type="file"
                  />
                  <button
                    className="button button--secondary"
                    disabled={projectOperation !== null}
                    onClick={() => void handleProjectDownload()}
                    type="button"
                  >
                    <FileDown aria-hidden="true" size={17} />
                    {projectOperation === "saving"
                      ? t("app.saving")
                      : t("app.save")}
                  </button>
                  <button
                    className="button button--secondary"
                    disabled={projectOperation !== null}
                    onClick={() => void clearSavedData()}
                    title={t("app.clearSavedHint")}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={17} />
                    {t("app.clearSaved")}
                  </button>
                </div>
                <div className="action-group">
                  <span>{t("app.image")}</span>
                  <button
                    className="button button--secondary"
                    disabled={exporting !== null}
                    onClick={() => requestExport("jpg")}
                    type="button"
                  >
                    <Download aria-hidden="true" size={17} />
                    {exporting === "jpg" ? t("app.creating") : "JPG"}
                  </button>
                  <button
                    className="button button--primary"
                    disabled={exporting !== null}
                    onClick={() => requestExport("png")}
                    type="button"
                  >
                    <Download aria-hidden="true" size={17} />
                    {exporting === "png" ? t("app.creating") : "PNG"}
                  </button>
                  <button
                    className="button button--secondary"
                    disabled={exporting !== null}
                    onClick={() => requestExport("pdf")}
                    type="button"
                  >
                    <FileDown aria-hidden="true" size={17} />
                    {exporting === "pdf" ? t("app.creating") : "PDF"}
                  </button>
                </div>
              </div>
              {exportError && (
                <div className="status status--error status--action" role="alert">
                  <span>{exportError}</span>
                  <button
                    className="button button--secondary"
                    onClick={() => void resetAppVersion()}
                    type="button"
                  >
                    {t("app.refreshApp")}
                  </button>
                </div>
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
      <ExportNoticeDialog
        format={pendingExport}
        onCancel={cancelExport}
        onConfirm={confirmExport}
        open={pendingExport !== null}
        requiresConsent={exportConsentRequired}
      />
    </div>
  );
}

export function App() {
  return (
    <LocaleProvider>
      <AppContent />
    </LocaleProvider>
  );
}
