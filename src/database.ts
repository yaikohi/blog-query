import { PostDBType } from "./types";

// --- POSTS DB
export const DB: PostDBType = {};
export const posts = () =>
  Object.entries(DB).map(([k, v]) => ({
    id: k,
    title: v.title,
    content: v.content,
    comments: v.comments,
  }));
