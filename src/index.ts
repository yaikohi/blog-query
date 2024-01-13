import cors from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import { PostDBType } from "./types";
import { EventBodySchema } from "./schemas";

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

// -- APP
const app = new Elysia();
// --- MIDDLEWARE
app
  .use(cors());
// --- ROUTES
app
  .get("/", () => "Hello Elysia")
  // ---- POSTS
  .group("/posts", (app) =>
    app
      .get("/", () => {
        return posts();
      }))
  // ---- EVENTS
  .group("/events", (app) =>
    app
      .post("/", ({ body, set }) => {
        console.log(body);
        set.status = "OK";
        // @ts-ignore
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
          DB[post.id] = post;
          console.log({ new: DB[post.id] });
          console.log({ db: DB });
        }
        if (type === "comment.created") {
          console.log(data);
          const { comment, postId } = data;
          // @ts-ignore
          DB[postId].comments.push(comment);
        }

        if (type === "comment.updated") {
          console.log(data);
          const { comment, postId } = data;
          const post = DB[postId];
          const commentFromPost = post.comments.find((cmnt) =>
            cmnt.id === comment.id
          );

          if (!commentFromPost) {
            set.status = "Not Found";
            return { success: false, message: "Comment not found." };
          }

          commentFromPost.status = comment.status;
          commentFromPost.content = comment.content;
          set.status = "OK";
          return {
            success: true,
            message: "Comment was updated.",
          };
        }
      }, {
        body: t.Any(EventBodySchema),
      }));
app
  .listen(PORT);

console.log(
  `🦊 Elysia is running the 'query' service at ${app.server?.hostname}:${app.server?.port}`,
);

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
