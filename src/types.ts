// --- TYPES
export type PostDBType = {
  [key: string]: PostType;
};
export type PostType = {
  id: string;
  title: string;
  content: string;
  comments: CommentType[] | [];
};

export type CommentType = {
  id: string;
  content: string;
  status: "PENDING" | "REJECTED" | "APPROVED";
};
export type PostEventType = {
  type:
  | "post.created"
  | "post.updated"
  | "post.deleted";
  data: {
    comment: CommentType;
    postId: string;
  };
};
export type CommentEventType = {
  type:
  | "comment.created"
  | "comment.updated"
  | "comment.moderated"
  | "comment.deleted";
};
export type EventType = PostEventType | CommentEventType;
