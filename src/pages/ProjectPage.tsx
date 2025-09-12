import { useParams, Link } from "react-router-dom";
import { getProjectBySlug } from "../lib/content";
import { MDXProvider } from "@mdx-js/react";
import { Callout } from "../ui/mdx/Callout";
import { Figure } from "../ui/mdx/Figure";
import { Note } from "../ui/mdx/Note";
import { Warning } from "../ui/mdx/Warning";
import { Files } from "../ui/mdx/Files";
import { Tabs, Tab } from "../ui/mdx/Tabs";
import { Details } from "../ui/mdx/Details";
import { Kbd, Badge, Stat } from "../ui/mdx/Inline";

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
            <MDXProvider
                components={{
                    Callout,
                    Figure,
                    Note,
                    Warning,
                    Files,
                    Tabs,
                    Tab,
                    Details,
                    Kbd,
                    Badge,
                    Stat,
                }}
            >
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
