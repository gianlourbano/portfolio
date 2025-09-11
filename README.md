# Portfolio (Vite + React + MDX)

This is a desktop-style portfolio with draggable windows and a built-in terminal.
Content for Projects and Blog is written in MDX and loaded at build time.

## Scripts

-   dev: start the local dev server
-   build: typecheck and build static site to `dist/`
-   preview: run a local preview of the production build

## Content

-   Add project MDX files under `content/projects/*.mdx`
-   Add blog MDX files under `content/blog/*.mdx`

Each MDX file should export a `meta` object:

```mdx
export const meta = {
    title: "My Project",
    slug: "my-project",
    date: "2025-09-11",
    tags: ["tag"],
    summary: "Short summary",
};

# My Project

Body content here...
```

## Deploy to GitHub Pages

1. Ensure `vite.config.ts` has `base: '/<repo>/'`.
2. Build the site, then push `dist/` to the `gh-pages` branch or use GitHub Actions.

Tip: Using HashRouter ensures routing works on Pages without custom 404 handling.

### GitHub Actions (recommended)

This repo includes a workflow at `.github/workflows/gh-pages.yml` that:

-   Installs dependencies and runs `npm run build`
-   Uploads `dist/` as a Pages artifact
-   Deploys to the `gh-pages` environment

To enable:

1. Push to `main`. The workflow will build and deploy.
2. In GitHub → Settings → Pages, set Source to “GitHub Actions”.
3. Confirm the published URL matches the configured base in `vite.config.ts` (here `/portfolio/`).

We also ship `public/.nojekyll` and `public/404.html` to improve SPA behavior on Pages.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
    globalIgnores(["dist"]),
    {
        files: ["**/*.{ts,tsx}"],
        extends: [
            // Other configs...

            // Remove tseslint.configs.recommended and replace with this
            ...tseslint.configs.recommendedTypeChecked,
            // Alternatively, use this for stricter rules
            ...tseslint.configs.strictTypeChecked,
            // Optionally, add this for stylistic rules
            ...tseslint.configs.stylisticTypeChecked,

            // Other configs...
        ],
        languageOptions: {
            parserOptions: {
                project: ["./tsconfig.node.json", "./tsconfig.app.json"],
                tsconfigRootDir: import.meta.dirname,
            },
            // other options...
        },
    },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
    globalIgnores(["dist"]),
    {
        files: ["**/*.{ts,tsx}"],
        extends: [
            // Other configs...
            // Enable lint rules for React
            reactX.configs["recommended-typescript"],
            // Enable lint rules for React DOM
            reactDom.configs.recommended,
        ],
        languageOptions: {
            parserOptions: {
                project: ["./tsconfig.node.json", "./tsconfig.app.json"],
                tsconfigRootDir: import.meta.dirname,
            },
            // other options...
        },
    },
]);
```
