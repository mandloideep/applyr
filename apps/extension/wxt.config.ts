import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./"), // or "./src" if using src directory
      },
    },
  }),
  manifest: {
    name: "Applyr - Job Saver",
    description: "Save job postings to your Applyr dashboard with one click",
    version: "0.1.0",
    permissions: ["storage", "activeTab", "scripting"],
    host_permissions: [
      "https://www.linkedin.com/*",
      "https://www.indeed.com/*",
      "https://boards.greenhouse.io/*",
      "https://jobs.lever.co/*",
    ],
  },
});
