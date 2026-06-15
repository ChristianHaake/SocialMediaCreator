import { useState, type ChangeEvent, type MutableRefObject } from "react";
import type { ModuleType, PhotoPostState, MessengerState, MicroblogState, PhotoPostImages, MessengerImages, MicroblogImages } from "../domain/types";
import { ConfigFileError, readConfigFile } from "../shared/lib/configFiles";
import type { ProjectArchiveResult, ProjectImageMaps } from "../shared/lib/projectArchives";
import { getTranslation } from "../i18n";
import type { TranslationKey } from "../i18n/de";

export type ConfigStatus = {
  type: "success" | "error";
  message: string;
};

export type ProjectOperation = "saving" | "loading" | null;

export interface ProjectStorageConfig {
  locale: "de" | "en";
  setLocale: (locale: "de" | "en") => void;
  t: (key: TranslationKey) => string;
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  setMobileView: (view: "editor" | "preview") => void;
  setImageError: (error: string | null) => void;
  isModuleChanged: (module: ModuleType) => boolean;
  
  photoPost: PhotoPostState;
  messenger: MessengerState;
  microblog: MicroblogState;
  setPhotoPost: (data: PhotoPostState) => void;
  setMessenger: (data: MessengerState) => void;
  setMicroblog: (data: MicroblogState) => void;
  initialPhotoPost: MutableRefObject<PhotoPostState>;
  initialMessenger: MutableRefObject<MessengerState>;
  initialMicroblog: MutableRefObject<MicroblogState>;
  
  photoImages: PhotoPostImages;
  messengerImages: MessengerImages;
  microblogImages: MicroblogImages;
  replaceModuleImages: (module: ModuleType, images: ProjectImageMaps) => void;
  clearModuleImages: (module: ModuleType) => void;
}

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

export function useProjectStorage(config: ProjectStorageConfig) {
  const [projectOperation, setProjectOperation] = useState<ProjectOperation>(null);
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);

  async function handleProjectDownload() {
    if (projectOperation) return;
    
    const { activeModule, photoPost, messenger, microblog, photoImages, messengerImages, microblogImages, locale, t } = config;
    
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
          ? t(projectErrorCode as TranslationKey)
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
      
      const importedConfig = archiveResult?.config ?? (await readConfigFile(file));
      
      if (
        config.isModuleChanged(importedConfig.module) &&
        !window.confirm(config.t("app.loadConfirm"))
      ) {
        if (archiveResult) disposeImportedImages?.(archiveResult.images);
        return;
      }

      if (importedConfig.module === "photoPost") {
        config.initialPhotoPost.current = importedConfig.data;
        config.setPhotoPost(importedConfig.data);
      } else if (importedConfig.module === "messenger") {
        config.initialMessenger.current = importedConfig.data;
        config.setMessenger(importedConfig.data);
      } else {
        config.initialMicroblog.current = importedConfig.data;
        config.setMicroblog(importedConfig.data);
      }

      config.setLocale(importedConfig.locale);
      if (archiveResult) {
        config.replaceModuleImages(importedConfig.module, archiveResult.images);
      } else {
        config.clearModuleImages(importedConfig.module);
      }
      
      config.setActiveModule(importedConfig.module);
      config.setMobileView("editor");
      config.setImageError(null);
      
      setConfigStatus({
        type: "success",
        message: getTranslation(importedConfig.locale, "app.loaded"),
      });
    } catch (error) {
      const projectErrorCode = getProjectErrorCode(error);
      setConfigStatus({
        type: "error",
        message:
          error instanceof ConfigFileError
            ? config.t(error.code as TranslationKey)
            : projectErrorCode
              ? config.t(projectErrorCode as TranslationKey)
            : config.t("config.loadFailed"),
      });
    } finally {
      setProjectOperation(null);
    }
  }

  return {
    projectOperation,
    configStatus,
    setConfigStatus,
    handleProjectDownload,
    handleProjectUpload,
  };
}
