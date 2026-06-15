import { useEffect, useRef, useState } from "react";
import type {
  ImageState,
  MessengerImages,
  MicroblogImages,
  ModuleType,
  PhotoPostImages,
} from "../domain/types";
import type { ProjectImageMaps } from "../shared/lib/projectArchives";

function revokeImage(image: ImageState | null | undefined) {
  if (image) URL.revokeObjectURL(image.url);
}

function revokePhotoImages(images: PhotoPostImages) {
  Object.values(images).forEach(({ profileImage, media, commentImages }) => {
    revokeImage(profileImage);
    Object.values(media).forEach(revokeImage);
    Object.values(commentImages).forEach(revokeImage);
  });
}

function revokeMicroblogImages(images: MicroblogImages) {
  Object.values(images).forEach(({ profileImage, commentImages }) => {
    revokeImage(profileImage);
    Object.values(commentImages).forEach(revokeImage);
  });
}

function revokeMessengerImages(images: MessengerImages) {
  Object.values(images).forEach(revokeImage);
}

export function useProjectImages() {
  const [photoImages, setPhotoImages] = useState<PhotoPostImages>({});
  const [messengerImages, setMessengerImages] = useState<MessengerImages>({});
  const [microblogImages, setMicroblogImages] = useState<MicroblogImages>({});
  const photoImagesRef = useRef(photoImages);
  const messengerImagesRef = useRef(messengerImages);
  const microblogImagesRef = useRef(microblogImages);

  photoImagesRef.current = photoImages;
  messengerImagesRef.current = messengerImages;
  microblogImagesRef.current = microblogImages;

  useEffect(
    () => () => {
      revokePhotoImages(photoImagesRef.current);
      revokeMessengerImages(messengerImagesRef.current);
      revokeMicroblogImages(microblogImagesRef.current);
    },
    [],
  );

  function clearModuleImages(module: ModuleType) {
    if (module === "photoPost") {
      revokePhotoImages(photoImagesRef.current);
      setPhotoImages({});
    } else if (module === "messenger") {
      revokeMessengerImages(messengerImagesRef.current);
      setMessengerImages({});
    } else {
      revokeMicroblogImages(microblogImagesRef.current);
      setMicroblogImages({});
    }
  }

  function replaceModuleImages(module: ModuleType, images: ProjectImageMaps) {
    if (module === "photoPost") {
      revokePhotoImages(photoImagesRef.current);
      setPhotoImages(images.photoPost);
    } else if (module === "messenger") {
      revokeMessengerImages(messengerImagesRef.current);
      setMessengerImages(images.messenger);
    } else {
      revokeMicroblogImages(microblogImagesRef.current);
      setMicroblogImages(images.microblog);
    }
  }

  function setPhotoImage(postId: string, image: ImageState | null) {
    setPhotoImages((current) => {
      const previous = current[postId]?.profileImage;
      if (previous?.url !== image?.url) revokeImage(previous);
      const currentPostImages = current[postId] ?? {
        profileImage: null,
        media: {},
        commentImages: {},
      };
      const nextPostImages = { ...currentPostImages, profileImage: image };
      const next = { ...current, [postId]: nextPostImages };
      if (
        !nextPostImages.profileImage &&
        Object.keys(nextPostImages.media).length === 0 &&
        Object.keys(nextPostImages.commentImages).length === 0
      ) {
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
      Object.values(postImages.media).forEach(revokeImage);
      Object.values(postImages.commentImages).forEach(revokeImage);
      const next = { ...current };
      delete next[postId];
      return next;
    });
  }

  function setPhotoMapImage(
    postId: string,
    collection: "media" | "commentImages",
    itemId: string,
    image: ImageState | null,
  ) {
    setPhotoImages((current) => {
      const postImages = current[postId] ?? {
        profileImage: null,
        media: {},
        commentImages: {},
      };
      const previous = postImages[collection][itemId];
      if (previous?.url !== image?.url) revokeImage(previous);
      const items = { ...postImages[collection] };
      if (image) items[itemId] = image;
      else delete items[itemId];
      const nextPostImages = { ...postImages, [collection]: items };
      const next = { ...current, [postId]: nextPostImages };
      if (
        !nextPostImages.profileImage &&
        Object.keys(nextPostImages.media).length === 0 &&
        Object.keys(nextPostImages.commentImages).length === 0
      ) {
        delete next[postId];
      }
      return next;
    });
  }

  function removePhotoImages(postId: string, ids: string[]) {
    setPhotoImages((current) => {
      const postImages = current[postId];
      if (!postImages) return current;
      const media = { ...postImages.media };
      const commentImages = { ...postImages.commentImages };
      ids.forEach((id) => {
        revokeImage(media[id]);
        revokeImage(commentImages[id]);
        delete media[id];
        delete commentImages[id];
      });
      const nextPostImages = { ...postImages, media, commentImages };
      const next = { ...current, [postId]: nextPostImages };
      if (
        !nextPostImages.profileImage &&
        Object.keys(media).length === 0 &&
        Object.keys(commentImages).length === 0
      ) {
        delete next[postId];
      }
      return next;
    });
  }

  function setMessengerImage(profileId: string, image: ImageState | null) {
    setMessengerImages((current) => {
      const previous = current[profileId];
      if (previous?.url !== image?.url) revokeImage(previous);
      const next = { ...current };
      if (image) next[profileId] = image;
      else delete next[profileId];
      return next;
    });
  }

  function setMicroblogProfileImage(
    postId: string,
    image: ImageState | null,
  ) {
    setMicroblogImages((current) => {
      const currentPostImages = current[postId] ?? {
        profileImage: null,
        commentImages: {},
      };
      const previous = currentPostImages.profileImage;
      if (previous?.url !== image?.url) revokeImage(previous);
      const nextPostImages = { ...currentPostImages, profileImage: image };
      const next = { ...current, [postId]: nextPostImages };
      if (!image && Object.keys(nextPostImages.commentImages).length === 0) {
        delete next[postId];
      }
      return next;
    });
  }

  function setMicroblogCommentImage(
    postId: string,
    itemId: string,
    image: ImageState | null,
  ) {
    setMicroblogImages((current) => {
      const postImages = current[postId] ?? {
        profileImage: null,
        commentImages: {},
      };
      const previous = postImages.commentImages[itemId];
      if (previous?.url !== image?.url) revokeImage(previous);
      const commentImages = { ...postImages.commentImages };
      if (image) commentImages[itemId] = image;
      else delete commentImages[itemId];
      const nextPostImages = { ...postImages, commentImages };
      const next = { ...current, [postId]: nextPostImages };
      if (
        !nextPostImages.profileImage &&
        Object.keys(commentImages).length === 0
      ) {
        delete next[postId];
      }
      return next;
    });
  }

  function removeMicroblogImages(postId: string, ids: string[]) {
    setMicroblogImages((current) => {
      const postImages = current[postId];
      if (!postImages) return current;
      const commentImages = { ...postImages.commentImages };
      ids.forEach((id) => {
        revokeImage(commentImages[id]);
        delete commentImages[id];
      });
      const nextPostImages = { ...postImages, commentImages };
      const next = { ...current, [postId]: nextPostImages };
      if (
        !nextPostImages.profileImage &&
        Object.keys(commentImages).length === 0
      ) {
        delete next[postId];
      }
      return next;
    });
  }

  function removeMicroblogPostImage(postId: string) {
    setMicroblogImages((current) => {
      const postImages = current[postId];
      if (postImages) {
        revokeImage(postImages.profileImage);
        Object.values(postImages.commentImages).forEach(revokeImage);
      }
      const next = { ...current };
      delete next[postId];
      return next;
    });
  }

  return {
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
  };
}
