import { env } from "bun";
import { EventType } from "./types";
import { DB } from "./database";

export const getURL = (): string => {
  const PORT_EVENTBUS = `4005`;
  const HOST_EVENTBUS = `event-bus-srv`;
  const URL_EVENTBUS = `http://${HOST_EVENTBUS}:${PORT_EVENTBUS}/events`;

  const localURL = `http://localhost:4005/events`;

  if (env.NODE_ENV === "development") {
    return localURL;
  } else {
    return URL_EVENTBUS;
  }
};

export const handleEvent = async (
  { data, type }: EventType,
): Promise<void | { success: boolean; message: string }> => {
  if (type === "post.created") {
    const post = data.post;
    DB[post.id] = post;
    return;
  }
  if (type === "comment.created") {
    const { comment, postId } = data;
    // @ts-ignore
    DB[postId].comments.push(comment);

    return;
  }

  if (type === "comment.updated") {
    const { comment, postId } = data;
    const post = DB[postId];
    const commentFromPost = post.comments.find((cmnt) =>
      cmnt.id === comment.id
    );

    if (!commentFromPost) {
      return { success: false, message: "Comment not found." };
    }

    commentFromPost.status = comment.status;
    commentFromPost.content = comment.content;

    return;
  }
};
