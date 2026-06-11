export const fieldLimits = {
  common: {
    postId: 100,
    posts: 50,
    commentId: 100,
    commentAuthor: 40,
    commentText: 500,
    comments: 100,
  },
  photoPost: {
    username: 30,
    location: 50,
    caption: 500,
    imageAlt: 160,
  },
  messenger: {
    contactName: 40,
    status: 60,
    messageId: 100,
    messageText: 1000,
    messages: 200,
  },
  microblog: {
    displayName: 50,
    handle: 30,
  },
} as const;
