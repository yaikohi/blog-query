import cors from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import { CommentType, EventType, PostDBType, PostType } from "./types";
import { EventBodySchema } from "./schemas";

// --- SERVICES -- PORTS
const PORT_EVENTBUS = `4005`;
// --- SERVICES -- HOSTS
const HOST_EVENTBUS = `event-bus-srv`;
// --- URLS
export const URL_EVENTBUS = `http://${HOST_EVENTBUS}:${PORT_EVENTBUS}/events`;

const PORT = 4002;
// --- POSTS DB
const DB: PostDBType = {};
const posts = () =>
  Object.entries(DB).map(([k, v]) => ({
    id: k,
    title: v.title,
    content: v.content,
    comments: v.comments,
  }));

export const handleEvent = async ({ data, type }: EventType) => {
  if (type === "post.created") {
    const post = data.post;
    DB[post.id] = post;
  }
  if (type === "comment.created") {
    const { comment, postId } = data;
    // @ts-ignore
    DB[postId].comments.push(comment);
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
  }
};
// -- APP
const app = new Elysia();
// --- MIDDLEWARE
app
  .use(cors());
// --- ROUTES
app
  // ---- POSTS
  .group("/posts", (app) =>
    app
      .get("/", () => {
        return posts();
      }))
  // ---- EVENTS
  .group("/events", (app) =>
    app
      .post("/", async ({ body, set }) => {
        const { type, data } = body;

        if (type === "post.created") {
          if (!data?.post) {
            set.status = "Not Found";
            return {
              success: false,
              message: "There was no 'post' provided. ",
            };
          }

          const post = data.post;

          DB[post.id] = post as PostType;

          set.status = "OK";
          return { success: true, message: `${type} handled.` };
        }
        if (type === "comment.created") {
          const { comment, postId } = data;
          if (!DB[postId].comments) {
            DB[postId].comments = [];
          }

          // @ts-ignore: I don't know what is happening here.
          DB[postId].comments.push(comment as CommentType);

          set.status = "OK";
          return { success: true, message: `${type} handled.` };
        }

        if (type === "comment.updated") {
          const { comment, postId } = data;
          const post = DB[postId];
          const commentFromPost = post.comments.find((cmnt) =>
            cmnt.id === comment.id
          );

          if (!commentFromPost) {
            set.status = "Not Found";
            return { success: false, message: "Comment not found." };
          }

          commentFromPost.status = comment.status as CommentType["status"];
          commentFromPost.content = comment.content;
          set.status = "OK";
          return {
            success: true,
            message: "Comment was updated.",
          };
        }
      }, {
        body: EventBodySchema,
      }));
app
  .listen(PORT, async () => {
    console.log(
      `🦊 Elysia is running the 'query' service at ${app.server?.hostname}:${app.server?.port}`,
    );

    const res = await fetch(URL_EVENTBUS, { method: "GET" });
    const result = await res.json();

    for (let event of result) {
      console.log(`Processing event: ${event.type}`);
      handleEvent({ type: event.type, data: event.data });
    }
  });
// ---- TEST
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
