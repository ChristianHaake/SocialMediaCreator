export type ModuleType = "photoPost" | "messenger" | "microblog";

export type PostComment = {
  id: string;
  author: string;
  text: string;
};

export type PhotoPost = {
  id: string;
  username: string;
  location: string;
  caption: string;
  imageAlt: string;
  likes: number;
  commentCount: number;
  showLocation: boolean;
  showComments: boolean;
  comments: PostComment[];
};

export type PhotoPostState = {
  activePostId: string;
  posts: PhotoPost[];
};

export type MessengerMessage = {
  id: string;
  type: "sent" | "received";
  text: string;
  time: string;
};

export type MessengerState = {
  contactName: string;
  status: string;
  messages: MessengerMessage[];
};

export type MicroblogPost = {
  id: string;
  displayName: string;
  handle: string;
  text: string;
  date: string;
  time: string;
  showDate: boolean;
  showTime: boolean;
  replies: number;
  reposts: number;
  likes: number;
  comments: PostComment[];
};

export type MicroblogState = {
  activePostId: string;
  posts: MicroblogPost[];
};

export type ImageState = {
  fileName: string;
  url: string;
};

export type PhotoPostImages = Record<
  string,
  {
    profileImage: ImageState | null;
    postImage: ImageState | null;
  }
>;

export type MicroblogImages = Record<string, ImageState | null>;

export const defaultPhotoPostItem: PhotoPost = {
  id: "photo-post-1",
  username: "projekt_kurs",
  location: "Lernwerkstatt",
  caption: "Heute dokumentieren wir unsere Projektidee.",
  imageAlt: "",
  likes: 128,
  commentCount: 14,
  showLocation: true,
  showComments: true,
  comments: [
    {
      id: "photo-comment-1",
      author: "lernteam",
      text: "Welche Quelle habt ihr für die Aussage verwendet?",
    },
  ],
};

export const defaultPhotoPost: PhotoPostState = {
  activePostId: defaultPhotoPostItem.id,
  posts: [defaultPhotoPostItem],
};

export const defaultMessenger: MessengerState = {
  contactName: "Projektgruppe",
  status: "online",
  messages: [
    {
      id: "message-1",
      type: "received",
      text: "Hast du die Quelle für unsere Aussage geprüft?",
      time: "09:41",
    },
    {
      id: "message-2",
      type: "sent",
      text: "Ja. Ich habe noch eine zweite Quelle zum Vergleich gefunden.",
      time: "09:43",
    },
    {
      id: "message-3",
      type: "received",
      text: "Gut, dann können wir beide im Beitrag nennen.",
      time: "09:44",
    },
  ],
};

export const defaultMicroblogItem: MicroblogPost = {
  id: "microblog-post-1",
  displayName: "Medienprojekt",
  handle: "medienprojekt",
  text: "Eine Behauptung wird nicht glaubwürdiger, nur weil sie oft geteilt wird. Prüfe Quelle, Kontext und Datum.",
  date: "2026-06-11",
  time: "10:15",
  showDate: true,
  showTime: true,
  replies: 8,
  reposts: 24,
  likes: 96,
  comments: [
    {
      id: "microblog-comment-1",
      author: "quellencheck",
      text: "Der ursprüngliche Kontext gehört unbedingt dazu.",
    },
  ],
};

export const defaultMicroblog: MicroblogState = {
  activePostId: defaultMicroblogItem.id,
  posts: [defaultMicroblogItem],
};
