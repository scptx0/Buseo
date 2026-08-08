import { defineConfig } from "@portalsdk/config";

export default defineConfig({
  channels: {
    "canal:global:posts": {
      mode: "broadcast",
      permissions: {
        subscribe: "anyone",
        publish: "anyone",
      },
    },
    "canal:global:posts:*:comments": {
      permissions: {
        subscribe: "anyone",
        publish: "anyone",
      },
    },
    "canal:global:posts:*:reactions": {
      permissions: {
        subscribe: "anyone",
        publish: "anyone",
      },
    },
  },
  notify: (ctx) => {
    if (ctx.message.type === "comment.liked") {
      return { title: "A alguien le gusto tu comentario", to: ctx.message.to };
    }
    if (ctx.message.type === "new.comment") {
      return { title: "Nueva respuesta en un post que sigues", to: ctx.message.to };
    }
    return null;
  },
});
