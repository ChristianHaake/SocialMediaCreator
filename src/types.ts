export type PhotoPostState = {
  username: string;
  location: string;
  caption: string;
  imageAlt: string;
  likes: number;
  comments: number;
  showLocation: boolean;
  showComments: boolean;
};

export type ImageState = {
  fileName: string;
  url: string;
};

export const defaultPhotoPost: PhotoPostState = {
  username: "projekt_kurs",
  location: "Lernwerkstatt",
  caption: "Heute dokumentieren wir unsere Projektidee.",
  imageAlt: "",
  likes: 128,
  comments: 14,
  showLocation: true,
  showComments: true,
};
