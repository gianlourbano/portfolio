import type React from "react";
import { useMemo } from "react";

export type Meta = {
    title: string;
    slug: string;
    date?: string;
    tags?: string[];
    summary?: string;
    cover?: string;
};

type Module = {
    default: React.ComponentType<any>;
    meta: Meta;
};

const projectModules = import.meta.glob("../../content/projects/*.mdx", {
    eager: true,
}) as Record<string, Module>;
const postModules = import.meta.glob("../../content/blog/*.mdx", {
    eager: true,
}) as Record<string, Module>;

const projects = Object.values(projectModules).map((m) => m.meta);
const posts = Object.values(postModules).map((m) => m.meta);

export function useContentIndex() {
    return useMemo(
        () => ({
            projects: projects.sort(sortByDateThenTitle),
            posts: posts.sort(sortByDateThenTitle),
        }),
        []
    );
}

export function getProjectBySlug(slug: string): Module | undefined {
    return Object.values(projectModules).find((m) => m.meta.slug === slug);
}
export function getPostBySlug(slug: string): Module | undefined {
    return Object.values(postModules).find((m) => m.meta.slug === slug);
}

function sortByDateThenTitle(a: Meta, b: Meta) {
    const ad = a.date ? Date.parse(a.date) : 0;
    const bd = b.date ? Date.parse(b.date) : 0;
    if (ad !== bd) return bd - ad;
    return a.title.localeCompare(b.title);
}
