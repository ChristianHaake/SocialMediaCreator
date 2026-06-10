export type ModuleType = "photoPost" | "messenger" | "microblog";

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

export type MicroblogState = {
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

export const defaultMicroblog: MicroblogState = {
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
};
