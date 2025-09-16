import { useParams, Link } from "react-router-dom";
import { getProjectBySlug } from "../lib/content";
import { DocLayout } from "../ui/DocLayout";

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
        <DocLayout
            meta={mod.meta}
            footer={
                <p>
                    <Link to="/">← Desktop</Link>
                </p>
            }
        >
            <Component />
        </DocLayout>
    );
}
