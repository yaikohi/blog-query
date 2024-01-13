import cors from "@elysiajs/cors";
import { Elysia } from "elysia";
import { EventType, PostDBType } from "./types";

const PORT = 4002;
// --- POSTS DB
export const DB: PostDBType = {};
export const posts = () =>
  Object.entries(DB).map(([k, v]) => ({
    id: k,
    title: v.title,
    content: v.content,
    comments: v.comments,
  }));

const handleEvent = async ({ data, type }: EventType) => {
  if (type === "post.created") {
    const post = data.post;
    DB[post.id] = post;
  }
  if (type === "comment.created") {
    const { comment, postId } = data;

    const postInDB = DB[postId];

    if (!postInDB.comments) {
      postInDB.comments = [];
    }
    // ???
    DB[postId].comments!.push(comment);
  }

  if (type === "comment.updated") {
    const { comment, postId } = data;
    const post = DB[postId];
    if (!post.comments) {
      post.comments = [];
    }
    const commentFromPost = post.comments.find((cmnt) =>
      cmnt.id === comment.id
    );

    if (!commentFromPost) {
      return { success: false, message: "Comment not found." };
    }

    commentFromPost.status = comment.status;
    commentFromPost.content = comment.content;
  }
};
// -- APP
export const app = new Elysia();
// --- MIDDLEWARE
app
  .use(cors());
app
  .listen(PORT, async () => {
    console.log(
      `🦊 Elysia is running the 'query' service at ${app.server?.hostname}:${app.server?.port}`,
    );

    const res = await fetch(`http://localhost:4005/events`, { method: "GET" });
    const result = await res.json();

    for (let event of result) {
      console.log(`Processing event: ${event.type}`);
      handleEvent({ type: event.type, data: event.data });
    }
  });

// app.handle(
//   new Request(`http://localhost:4002/events`, {
//     method: "POST",
//     body: JSON.stringify(
//       {
//         "type": "post.created",
//         "data": {
//           "post": {
//             "id": "someuid",
//             "title": "Hey!",
//             "content": "What's up?!",
//             "comments": [
//               {
//                 "id": "someuid2",
//                 "content": "Comment!!",
//                 "status": "PENDING",
//               },
//             ],
//           },
//         },
//       },
//     ),
//     headers: {
//       "Content-Type": "application/json",
//     },
//   }),
// );
