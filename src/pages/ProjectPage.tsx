import { useParams, Link } from "react-router-dom";
import { getProjectBySlug } from "../lib/content";
import { MDXProvider } from "@mdx-js/react";

export function ProjectPage() {
    const { slug } = useParams();
    const mod = slug ? getProjectBySlug(slug) : undefined;
    if (!mod) {
        return (
            <div className="page">
                <p>Project not found.</p>
                <Link to="/">← Back</Link>
            </div>
        );
    }
    const Component = mod.default;
    return (
        <div className="page">
            <header className="page-header">
                <h1>{mod.meta.title}</h1>
                {mod.meta.date && <time>{mod.meta.date}</time>}
            </header>
            <MDXProvider>
                <article className="prose">
                    <Component />
                </article>
            </MDXProvider>
            <p>
                <Link to="/">← Desktop</Link>
            </p>
        </div>
    );
}
