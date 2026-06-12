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
  useRef,
  useState,
} from "react";
import { AppFooter } from "./components/AppFooter";
import { AppHeader } from "./components/AppHeader";
import { ContentPage } from "./components/ContentPage";
import { EducationNotice } from "./components/EducationNotice";
import { ExportNoticeDialog } from "./components/ExportNoticeDialog";
import { MessengerEditor } from "../features/messenger/MessengerEditor";
import { MessengerPreview } from "../features/messenger/MessengerPreview";
import { MicroblogEditor } from "../features/microblog/MicroblogEditor";
import { MicroblogPreview } from "../features/microblog/MicroblogPreview";
import { PhotoPostEditor } from "../features/photo-post/PhotoPostEditor";
import { PhotoPostPreview } from "../features/photo-post/PhotoPostPreview";
import { TeacherInfoDialog } from "./components/TeacherInfoDialog";
import { VerificationPage } from "../features/verification/VerificationPage";
import { contentPages, isContentPath } from "../content";
import { getTranslation, LocaleProvider, useTranslation } from "../i18n";
import type { TranslationKey } from "../i18n/de";
import type { ModuleType } from "../domain/types";
import {
  getDefaultMessenger,
  getDefaultMicroblog,
  getDefaultPhotoPost,
} from "../domain/types";
import {
  ConfigFileError,
  readConfigFile,
} from "../shared/lib/configFiles";
import {
  hasExportConsent,
  storeExportConsent,
} from "../shared/lib/exportConsent";
import {
  exportElementAsImage,
  exportElementAsPdf,
  type ExportFormat,
  type ImageExportFormat,
} from "../shared/lib/exportImage";
import { useProjectImages } from "./useProjectImages";
import type { ProjectArchiveResult } from "../shared/lib/projectArchives";

type MobileView = "editor" | "preview";

function getProjectErrorCode(error: unknown): TranslationKey | null {
  if (
    error instanceof Error &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code.startsWith("project.")
  ) {
    return error.code as TranslationKey;
  }
  return null;
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
  const [exportError, setExportError] = useState<string | null>(null);
  const [configStatus, setConfigStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [projectOperation, setProjectOperation] = useState<
    "saving" | "loading" | null
  >(null);
  const [pendingExport, setPendingExport] = useState<ExportFormat | null>(null);
  const [exportConsentRequired, setExportConsentRequired] = useState(false);
  const [teacherInfoOpen, setTeacherInfoOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const configInputRef = useRef<HTMLInputElement>(null);
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

  async function handleProjectDownload() {
    if (projectOperation) return;
    const data =
      activeModule === "photoPost"
        ? photoPost
        : activeModule === "messenger"
          ? messenger
          : microblog;
    const images =
      activeModule === "photoPost"
        ? photoImages
        : activeModule === "messenger"
          ? messengerImages
          : microblogImages;
    setConfigStatus(null);
    setProjectOperation("saving");
    try {
      const { createProjectArchive, downloadProjectArchive } = await import(
        "../shared/lib/projectArchives"
      );
      const archive = await createProjectArchive(
        activeModule,
        data,
        locale,
        images,
      );
      downloadProjectArchive(archive, activeModule);
      setConfigStatus({
        type: "success",
        message: t("app.saved"),
      });
    } catch (error) {
      const projectErrorCode = getProjectErrorCode(error);
      setConfigStatus({
        type: "error",
        message: projectErrorCode
          ? t(projectErrorCode)
          : t("project.saveFailed"),
      });
    } finally {
      setProjectOperation(null);
    }
  }

  async function handleProjectUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || projectOperation) return;

    setConfigStatus(null);
    setProjectOperation("loading");

    try {
      const legacyJson =
        file.name.toLowerCase().endsWith(".json") ||
        file.type === "application/json";
      let archiveResult: ProjectArchiveResult | null = null;
      let disposeImportedImages:
        | ((images: ProjectArchiveResult["images"]) => void)
        | null = null;
      if (!legacyJson) {
        const archiveTools = await import("../shared/lib/projectArchives");
        archiveResult = await archiveTools.readProjectArchive(file);
        disposeImportedImages = archiveTools.disposeProjectImages;
      }
      const config = archiveResult?.config ?? (await readConfigFile(file));
      if (
        isModuleChanged(config.module) &&
        !window.confirm(
          t("app.loadConfirm"),
        )
      ) {
        if (archiveResult) disposeImportedImages?.(archiveResult.images);
        return;
      }

      if (config.module === "photoPost") {
        initialPhotoPost.current = config.data;
        setPhotoPost(config.data);
      } else if (config.module === "messenger") {
        initialMessenger.current = config.data;
        setMessenger(config.data);
      } else {
        initialMicroblog.current = config.data;
        setMicroblog(config.data);
      }

      setLocale(config.locale);
      if (archiveResult) {
        replaceModuleImages(config.module, archiveResult.images);
      } else {
        clearModuleImages(config.module);
      }
      setActiveModule(config.module);
      setMobileView("editor");
      setImageError(null);
      setConfigStatus({
        type: "success",
        message: getTranslation(config.locale, "app.loaded"),
      });
    } catch (error) {
      const projectErrorCode = getProjectErrorCode(error);
      setConfigStatus({
        type: "error",
        message:
          error instanceof ConfigFileError
            ? t(error.code)
            : projectErrorCode
              ? t(projectErrorCode)
            : t("config.loadFailed"),
      });
    } finally {
      setProjectOperation(null);
    }
  }

  function requestExport(format: ExportFormat) {
    if (exporting) return;
    setExportConsentRequired(!hasExportConsent());
    setPendingExport(format);
  }

  function confirmExport() {
    if (!pendingExport) return;
    if (exportConsentRequired) storeExportConsent();

    const format = pendingExport;
    setPendingExport(null);
    if (format === "pdf") {
      void performPdfExport();
    } else {
      void performImageExport(format);
    }
  }

  async function performImageExport(format: ImageExportFormat) {
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
        activeModule,
      );
    } catch {
      setExportError(
        t("app.imageExportError"),
      );
    } finally {
      setExporting(null);
    }
  }

  async function performPdfExport() {
    if (!previewRef.current || exporting) return;
    setExportError(null);
    setExporting("pdf");
    try {
      await exportElementAsPdf(
        previewRef.current,
        activeModule === "photoPost"
          ? "social-media-creator-foto-post"
          : activeModule === "messenger"
            ? "social-media-creator-messenger-chat"
            : "social-media-creator-mikroblog",
        locale,
      );
    } catch {
      setExportError(
        t("app.pdfExportError"),
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
          ref={previewRef}
          value={photoPost}
        />
      );
    }

    if (activeModule === "messenger") {
      return (
        <MessengerPreview
          images={messengerImages}
          ref={previewRef}
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
        ref={previewRef}
        value={microblog}
      />
    );
  }

  return (
    <div className="app">
      <AppHeader onOpenTeacherInfo={() => setTeacherInfoOpen(true)} />
      {pathname === "/" && <EducationNotice />}

      {pathname === "/verifizieren" ? (
        <VerificationPage />
      ) : isContentPath(pathname) ? (
        <ContentPage {...contentPages[locale][pathname]} />
      ) : pathname !== "/" ? (
        <ContentPage
          content={t("app.notFoundText")}
          title={t("app.notFound")}
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
                {renderPreview()}
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
      <ExportNoticeDialog
        onCancel={() => setPendingExport(null)}
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
