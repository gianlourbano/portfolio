import { MDXProvider } from "@mdx-js/react";
import AboutMDX from "../../content/about.mdx";
import { Callout } from "./mdx/Callout";
import { Figure } from "./mdx/Figure";
import { Note } from "./mdx/Note";
import { Warning } from "./mdx/Warning";
import { Files } from "./mdx/Files";
import { Tabs, Tab } from "./mdx/Tabs";
import { Details } from "./mdx/Details";
import { Kbd, Badge, Stat } from "./mdx/Inline";
import { TwoColumn } from "./mdx/TwoColumn";

export function AboutContent() {
    const components = {
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
    return (
        <MDXProvider components={components}>
            <div className="prose">
                <AboutMDX />
            </div>
        </MDXProvider>
    );
}
