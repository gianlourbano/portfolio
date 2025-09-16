import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeKatex from "rehype-katex";
import remarkReadingTime from "remark-reading-time";
import readingMdxTime from "remark-reading-time/mdx";

// https://vite.dev/config/
export default defineConfig({
    // If your repo name on GitHub is different, set base to `/<repo>/`
    base: "/portfolio/",
    plugins: [
        react(),
        mdx({
            remarkPlugins: [remarkGfm, remarkMath, remarkReadingTime, readingMdxTime],
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
                [rehypeKatex, { output: "html" }],
            ],
        }),
    ],
});
