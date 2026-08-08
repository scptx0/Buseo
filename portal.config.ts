import { defineConfig } from "@portalsdk/config";

export default defineConfig({
  channels: {
    "canal:global:feed": {
      mode: "broadcast",
    },
  },
});
