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
                        theme: {
                            dark: "vitesse-dark",
                            light: "vitesse-light",
                        },
                        keepBackground: false,
                    },
                ],
            ],
        }),
    ],
});
