export type ModuleType = "photoPost" | "messenger" | "microblog";
export type Locale = "de" | "en" | "fr" | "es" | "nl";
export type Theme = "light" | "dim" | "dark";
export type PostViewMode = "post" | "comments";
export type MicroblogLayoutMode = "feed" | "thread";
export type TimelineSortOrder = "newest" | "oldest";

export type CommentReply = {
  id: string;
  author: string;
  text: string;
  timestamp: string;
};

export type PostComment = {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  replies: CommentReply[];
};

export type PhotoMedia = {
  id: string;
  imageAlt: string;
  mode: "image" | "video";
  videoDuration: string;
  videoViews: string;
};

export type PhotoPost = {
  id: string;
  username: string;
  location: string;
  caption: string;
  date: string;
  time: string;
  viewMode: PostViewMode;
  likes: number;
  commentCount: number;
  showLocation: boolean;
  showComments: boolean;
  activeMediaId: string;
  media: PhotoMedia[];
  comments: PostComment[];
};

export type PhotoPostState = {
  theme: Theme;
  sortOrder: TimelineSortOrder;
  activePostId: string;
  posts: PhotoPost[];
};

export type MessengerProfile = {
  id: string;
  name: string;
  status: string;
  side: "left" | "right";
};

export type MessengerMessage = {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  seen: boolean;
};

export type MessengerState = {
  theme: Theme;
  profiles: [MessengerProfile, MessengerProfile];
  messages: MessengerMessage[];
};

export type MicroblogPost = {
  id: string;
  displayName: string;
  handle: string;
  text: string;
  date: string;
  time: string;
  viewMode: PostViewMode;
  replies: number;
  reposts: number;
  likes: number;
  comments: PostComment[];
};

export type MicroblogState = {
  theme: Theme;
  layoutMode: MicroblogLayoutMode;
  sortOrder: TimelineSortOrder;
  activePostId: string;
  posts: MicroblogPost[];
};

export type ImageState = {
  fileName: string;
  blob: Blob;
  url: string;
  /** True when `blob` is already downscaled/encoded for archiving (e.g. loaded
   * from a project archive), so saving must not re-run lossy optimization. */
  optimized?: boolean;
};

export type PhotoPostImages = Record<
  string,
  {
    profileImage: ImageState | null;
    media: Record<string, ImageState>;
    commentImages: Record<string, ImageState>;
  }
>;

export type MessengerImages = Record<string, ImageState>;

export type MicroblogImages = Record<
  string,
  {
    profileImage: ImageState | null;
    commentImages: Record<string, ImageState>;
  }
>;

export const defaultPhotoPostItem: PhotoPost = {
  id: "photo-post-1",
  username: "projekt_kurs",
  location: "Lernwerkstatt",
  caption: "Heute dokumentieren wir unsere Projektidee.",
  date: "2026-06-11",
  time: "",
  viewMode: "post",
  likes: 128,
  commentCount: 14,
  showLocation: true,
  showComments: true,
  activeMediaId: "photo-media-1",
  media: [
    {
      id: "photo-media-1",
      imageAlt: "",
      mode: "image",
      videoDuration: "",
      videoViews: "",
    },
  ],
  comments: [
    {
      id: "photo-comment-1",
      author: "lernteam",
      text: "Welche Quelle habt ihr für die Aussage verwendet?",
      timestamp: "vor 5 Minuten",
      replies: [
        {
          id: "photo-reply-1",
          author: "projekt_kurs",
          text: "Wir haben zwei voneinander unabhängige Quellen verglichen.",
          timestamp: "vor 2 Minuten",
        },
      ],
    },
  ],
};

export const defaultPhotoPost: PhotoPostState = {
  theme: "light",
  sortOrder: "newest",
  activePostId: defaultPhotoPostItem.id,
  posts: [defaultPhotoPostItem],
};

export const defaultMessenger: MessengerState = {
  theme: "light",
  profiles: [
    {
      id: "messenger-profile-left",
      name: "Projektgruppe",
      status: "online",
      side: "left",
    },
    {
      id: "messenger-profile-right",
      name: "Ich",
      status: "verfügbar",
      side: "right",
    },
  ],
  messages: [
    {
      id: "message-1",
      senderId: "messenger-profile-left",
      text: "Hast du die Quelle für unsere Aussage geprüft?",
      timestamp: "09:41",
      seen: false,
    },
    {
      id: "message-2",
      senderId: "messenger-profile-right",
      text: "Ja. Ich habe noch eine zweite Quelle zum Vergleich gefunden.",
      timestamp: "09:43",
      seen: true,
    },
    {
      id: "message-3",
      senderId: "messenger-profile-left",
      text: "Gut, dann können wir beide im Beitrag nennen.",
      timestamp: "09:44",
      seen: false,
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
  viewMode: "post",
  replies: 8,
  reposts: 24,
  likes: 96,
  comments: [
    {
      id: "microblog-comment-1",
      author: "quellencheck",
      text: "Der ursprüngliche Kontext gehört unbedingt dazu.",
      timestamp: "vor 8 Minuten",
      replies: [
        {
          id: "microblog-reply-1",
          author: "medienprojekt",
          text: "Genau, ohne Kontext kann die Aussage irreführend wirken.",
          timestamp: "vor 3 Minuten",
        },
      ],
    },
  ],
};

export const defaultMicroblog: MicroblogState = {
  theme: "light",
  layoutMode: "feed",
  sortOrder: "newest",
  activePostId: defaultMicroblogItem.id,
  posts: [defaultMicroblogItem],
};

const englishPhotoPost: PhotoPostState = {
  ...defaultPhotoPost,
  posts: [
    {
      ...defaultPhotoPostItem,
      username: "project_class",
      location: "Learning Lab",
      caption: "Today we are documenting our project idea.",
      comments: [
        {
          id: "photo-comment-1",
          author: "learning_team",
          text: "Which source did you use for this statement?",
          timestamp: "5 minutes ago",
          replies: [
            {
              id: "photo-reply-1",
              author: "project_class",
              text: "We compared two independent sources.",
              timestamp: "2 minutes ago",
            },
          ],
        },
      ],
    },
  ],
};

const englishMessenger: MessengerState = {
  ...defaultMessenger,
  profiles: [
    {
      ...defaultMessenger.profiles[0],
      name: "Project group",
      status: "online",
    },
    {
      ...defaultMessenger.profiles[1],
      name: "Me",
      status: "available",
    },
  ],
  messages: [
    {
      ...defaultMessenger.messages[0],
      text: "Did you verify the source for our statement?",
    },
    {
      ...defaultMessenger.messages[1],
      text: "Yes. I found a second source for comparison.",
    },
    {
      ...defaultMessenger.messages[2],
      text: "Good, then we can cite both in the post.",
    },
  ],
};

const englishMicroblog: MicroblogState = {
  ...defaultMicroblog,
  posts: [
    {
      ...defaultMicroblogItem,
      displayName: "Media Project",
      handle: "media_project",
      text: "A claim does not become more credible just because it is shared often. Check the source, context, and date.",
      comments: [
        {
          id: "microblog-comment-1",
          author: "source_check",
          text: "The original context is essential.",
          timestamp: "8 minutes ago",
          replies: [
            {
              id: "microblog-reply-1",
              author: "media_project",
              text: "Exactly. Without context, the statement can be misleading.",
              timestamp: "3 minutes ago",
            },
          ],
        },
      ],
    },
  ],
};

export function getDefaultPhotoPost(locale: Locale) {
  if (locale === "en") return structuredClone(englishPhotoPost);
  if (locale === "fr" || locale === "es" || locale === "nl") {
    const labels = {
      fr: { user: "projet_classe", location: "Atelier pédagogique", caption: "Aujourd’hui, nous documentons notre idée de projet.", author: "equipe_apprentissage", question: "Quelle source avez-vous utilisée pour cette affirmation ?", answer: "Nous avons comparé deux sources indépendantes.", commentTime: "il y a 5 minutes", replyTime: "il y a 2 minutes" },
      es: { user: "proyecto_clase", location: "Aula de aprendizaje", caption: "Hoy documentamos nuestra idea de proyecto.", author: "equipo_aprendizaje", question: "¿Qué fuente utilizasteis para esta afirmación?", answer: "Comparamos dos fuentes independientes.", commentTime: "hace 5 minutos", replyTime: "hace 2 minutos" },
      nl: { user: "project_klas", location: "Leerwerkplaats", caption: "Vandaag leggen we ons projectidee vast.", author: "leerteam", question: "Welke bron hebben jullie voor deze bewering gebruikt?", answer: "We hebben twee onafhankelijke bronnen vergeleken.", commentTime: "5 minuten geleden", replyTime: "2 minuten geleden" },
    }[locale];
    const value = structuredClone(englishPhotoPost);
    Object.assign(value.posts[0], { username: labels.user, location: labels.location, caption: labels.caption });
    Object.assign(value.posts[0].comments[0], { author: labels.author, text: labels.question, timestamp: labels.commentTime });
    Object.assign(value.posts[0].comments[0].replies[0], { author: labels.user, text: labels.answer, timestamp: labels.replyTime });
    return value;
  }
  return structuredClone(defaultPhotoPost);
}

export function getDefaultMessenger(locale: Locale) {
  if (locale === "en") return structuredClone(englishMessenger);
  if (locale === "fr" || locale === "es" || locale === "nl") {
    const labels = {
      fr: { group: "Groupe projet", me: "Moi", available: "disponible", q: "As-tu vérifié la source de notre affirmation ?", a: "Oui. J’ai trouvé une deuxième source pour comparer.", done: "Bien, nous pouvons citer les deux dans la publication." },
      es: { group: "Grupo del proyecto", me: "Yo", available: "disponible", q: "¿Has verificado la fuente de nuestra afirmación?", a: "Sí. Encontré una segunda fuente para comparar.", done: "Bien, podemos citar ambas en la publicación." },
      nl: { group: "Projectgroep", me: "Ik", available: "beschikbaar", q: "Heb je de bron van onze bewering gecontroleerd?", a: "Ja. Ik heb een tweede bron gevonden om te vergelijken.", done: "Goed, dan kunnen we beide in het bericht noemen." },
    }[locale];
    const value = structuredClone(englishMessenger);
    Object.assign(value.profiles[0], { name: labels.group });
    Object.assign(value.profiles[1], { name: labels.me, status: labels.available });
    value.messages[0].text = labels.q; value.messages[1].text = labels.a; value.messages[2].text = labels.done;
    return value;
  }
  return structuredClone(defaultMessenger);
}

export function getDefaultMicroblog(locale: Locale) {
  if (locale === "en") return structuredClone(englishMicroblog);
  if (locale === "fr" || locale === "es" || locale === "nl") {
    const labels = {
      fr: { name: "Projet médias", handle: "projet_medias", text: "Une affirmation ne devient pas plus crédible simplement parce qu’elle est souvent partagée. Vérifiez la source, le contexte et la date.", author: "verif_source", comment: "Le contexte d’origine est essentiel.", reply: "Exactement. Sans contexte, l’affirmation peut induire en erreur.", commentTime: "il y a 8 minutes", replyTime: "il y a 3 minutes" },
      es: { name: "Proyecto de medios", handle: "proyecto_medios", text: "Una afirmación no es más creíble solo porque se comparta a menudo. Comprueba la fuente, el contexto y la fecha.", author: "verificacion_fuente", comment: "El contexto original es esencial.", reply: "Exacto. Sin contexto, la afirmación puede resultar engañosa.", commentTime: "hace 8 minutos", replyTime: "hace 3 minutos" },
      nl: { name: "Mediaproject", handle: "mediaproject", text: "Een bewering wordt niet geloofwaardiger doordat ze vaak wordt gedeeld. Controleer de bron, context en datum.", author: "broncontrole", comment: "De oorspronkelijke context is essentieel.", reply: "Precies. Zonder context kan de bewering misleidend zijn.", commentTime: "8 minuten geleden", replyTime: "3 minuten geleden" },
    }[locale];
    const value = structuredClone(englishMicroblog);
    Object.assign(value.posts[0], { displayName: labels.name, handle: labels.handle, text: labels.text });
    Object.assign(value.posts[0].comments[0], { author: labels.author, text: labels.comment, timestamp: labels.commentTime });
    Object.assign(value.posts[0].comments[0].replies[0], { author: labels.handle, text: labels.reply, timestamp: labels.replyTime });
    return value;
  }
  return structuredClone(defaultMicroblog);
}
