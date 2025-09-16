import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "katex/dist/katex.min.css"; // KaTeX styles for math rendering
import App from "./App.tsx";
import { HashRouter } from "react-router-dom";
import { ThemeProvider, createGlobalStyle } from "styled-components";
import { styleReset } from "react95";
import original from "react95/dist/themes/original";

const ResetStyles = createGlobalStyle`${styleReset}`;

// Default to retro theme on first load
if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (!root.dataset.theme) root.dataset.theme = "retro";
    // Set a base-aware default wallpaper image
    const base = (import.meta as any).env?.BASE_URL || "/";
    const url = `${base.replace(/\/$/, "")}/win95-tile.svg`;
    if (!getComputedStyle(root).getPropertyValue("--wallpaper-image")) {
        root.style.setProperty("--wallpaper-image", `url("${url}")`);
    }
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider theme={original}>
            <ResetStyles />
            <HashRouter>
                <App />
            </HashRouter>
        </ThemeProvider>
    </StrictMode>
);
