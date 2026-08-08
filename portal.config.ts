import { defineConfig } from "@portalsdk/config";

export default defineConfig({
  channels: {
    "canal:global:posts": {
      mode: "broadcast",
    },
  },
});
