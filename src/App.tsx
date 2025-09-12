import { Routes, Route } from "react-router-dom";
import { Desktop } from "./desktop/Desktop.tsx";
import { ProjectPage } from "./pages/ProjectPage.tsx";
import { BlogPostPage } from "./pages/BlogPostPage.tsx";
import "./App.css";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Desktop />} />
            <Route path="/projects/:slug" element={<ProjectPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="*" element={<Desktop />} />
        </Routes>
    );
}
