import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";

// https://vite.dev/config/
export default defineConfig({
    // If your repo name on GitHub is different, set base to `/<repo>/`
    base: "/portfolio/",
    plugins: [
        react(),
        mdx({
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
                [
                    rehypePrettyCode,
                    {
                        // Dark, high-contrast theme that pairs better with retro UI
                        theme: "monokai",
                        // Allow theme background to render for better contrast
                        keepBackground: true,
                    },
                ],
            ],
        }),
    ],
});
