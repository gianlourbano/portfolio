import { MDXProvider } from "@mdx-js/react";
import { Callout } from "./mdx/Callout";
import { Figure } from "./mdx/Figure";
import { Note } from "./mdx/Note";
import { Warning } from "./mdx/Warning";
import { Files } from "./mdx/Files";
import { Tabs, Tab } from "./mdx/Tabs";
import { Details } from "./mdx/Details";
import { Kbd, Badge, Stat } from "./mdx/Inline";
import { TwoColumn } from "./mdx/TwoColumn";
import type { Meta } from "../lib/content";
import React from "react";

const mdxComponents = {
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
    TwoColumn,
} as const;

export function DocLayout({
    meta,
    children,
    footer,
}: {
    meta: Meta;
    children: React.ReactNode;
    footer?: React.ReactNode;
}) {
    const display = meta.readingTime
        ? {
              words: meta.readingTime.words,
              text:
                  meta.readingTime.text ||
                  `${Math.max(
                      1,
                      Math.round((meta.readingTime.words || 0) / 200)
                  )} min read`,
          }
        : null;

    return (
        <div className="page">
            <header className="page-header">
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        fontSize: 14,
                        opacity: 0.85,
                    }}
                >
                    {meta.date && <time>{meta.date}</time>}
                    {display && <span>{display.text}</span>}
                    {display?.words && (
                        <span style={{ opacity: 0.7 }}>
                            {display.words} words
                        </span>
                    )}
                </div>
            </header>
            <MDXProvider components={mdxComponents}>
                <article className="prose">{children}</article>
            </MDXProvider>
            {footer}
        </div>
    );
}
