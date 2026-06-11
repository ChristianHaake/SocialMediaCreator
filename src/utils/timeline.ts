import type { TimelineSortOrder } from "../types";

type TimelinePost = {
  date: string;
  time: string;
};

export function formatTimelineDate(date: string, time: string) {
  const [year, month, day] = date.split("-");
  const formattedDate =
    year && month && day ? `${day}.${month}.${year}` : date;
  return time ? `${formattedDate} · ${time}` : formattedDate;
}

export function sortTimelinePosts<T extends TimelinePost>(
  posts: T[],
  sortOrder: TimelineSortOrder,
) {
  const direction = sortOrder === "newest" ? -1 : 1;
  return posts
    .map((post, index) => ({ post, index }))
    .sort((left, right) => {
      const leftValue = `${left.post.date}T${left.post.time || "00:00"}`;
      const rightValue = `${right.post.date}T${right.post.time || "00:00"}`;
      return (
        leftValue.localeCompare(rightValue) * direction ||
        left.index - right.index
      );
    })
    .map(({ post }) => post);
}

export function todayInputValue() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}
