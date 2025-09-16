import { useParams, Link } from "react-router-dom";
import { getPostBySlug } from "../lib/content";
import { DocLayout } from "../ui/DocLayout";

export function BlogPostPage() {
    const { slug } = useParams();
    const mod = slug ? getPostBySlug(slug) : undefined;
    if (!mod) {
        return (
            <div className="page">
                <p>Post not found.</p>
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
