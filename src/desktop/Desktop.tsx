import { useEffect, useRef, useState } from "react";
import type React from "react";
import { Window } from "../ui/Window";
import { Terminal } from "../ui/Terminal";
import {
    useContentIndex,
    type Meta,
    getProjectBySlug,
    getPostBySlug,
} from "../lib/content";
import { React95Icon } from "../ui/React95Icons";
import { Button } from "react95";
import { MDXProvider } from "@mdx-js/react";
import { Callout } from "../ui/mdx/Callout";
import { Figure } from "../ui/mdx/Figure";
import { Note } from "../ui/mdx/Note";
import { Warning } from "../ui/mdx/Warning";
import { Files } from "../ui/mdx/Files";
import { AboutContent } from "../ui/AboutContent";
import { Tabs, Tab } from "../ui/mdx/Tabs";
import { Details } from "../ui/mdx/Details";
import { Kbd, Badge, Stat } from "../ui/mdx/Inline";

// Retro-only: settings and sounds removed per request

type Kind = "projects" | "blog" | "about" | "terminal" | "doc";
type Bounds = { x: number; y: number; w: number; h: number };
type DocPayload = { type: "project" | "post"; slug: string };
type Win = {
    id: string;
    kind: Kind;
    title: string;
    icon: string;
    minimized: boolean;
    maximized: boolean;
    z: number;
    bounds: Bounds;
    // For 'doc' windows we persist the document payload so restored windows work after reload
    payload?: DocPayload;
};

export function Desktop() {
    const { projects, posts } = useContentIndex();
    const [startOpen, setStartOpen] = useState(false);
    const [wins, setWins] = useState<Win[]>(() => {
        try {
            const raw = localStorage.getItem("desktop:wins");
            if (raw) return JSON.parse(raw) as Win[];
        } catch {}
        return [];
    });
    const [activeId, setActiveId] = useState<string | null>(null);
    const zCounter = useRef(10);
    const idCounter = useRef(0);
    const lastUnminimized = useRef<string[]>([]);
    const [showDesktop, setShowDesktop] = useState(false);
    const TASKBAR_H = 40;

    useEffect(() => {
        const closeOnClickOutside = () => setStartOpen(false);
        if (startOpen) document.addEventListener("click", closeOnClickOutside);
        return () => document.removeEventListener("click", closeOnClickOutside);
    }, [startOpen]);

    // Enforce retro theme on mount
    useEffect(() => {
        const root = document.documentElement;
        root.dataset.theme = "retro";
    }, []);

    // Restore counters and active window from localStorage on mount
    useEffect(() => {
        if (wins.length) {
            zCounter.current = Math.max(
                ...wins.map((w) => w.z),
                zCounter.current
            );
            const maxId = wins.reduce((acc, w) => {
                const n = Number(w.id.split("-")[1] || 0);
                return Math.max(acc, isNaN(n) ? 0 : n);
            }, 0);
            idCounter.current = Math.max(idCounter.current, maxId);
        }
        try {
            const a = localStorage.getItem("desktop:active");
            if (a) setActiveId(a);
        } catch {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist windows and active window id
    useEffect(() => {
        try {
            localStorage.setItem("desktop:wins", JSON.stringify(wins));
            localStorage.setItem("desktop:active", activeId || "");
        } catch {}
    }, [wins, activeId]);

    const kindMeta: Record<
        Kind,
        {
            title: string;
            icon: string;
            base: { x: number; y: number; w?: number; h?: number };
        }
    > = {
        projects: {
            title: "Projects",
            icon: "Projects",
            base: { x: 60, y: 60, w: 520, h: 360 },
        },
        blog: {
            title: "Blog",
            icon: "Blog",
            base: { x: 200, y: 120, w: 520, h: 360 },
        },
        about: {
            title: "About",
            icon: "About",
            base: { x: 340, y: 180, w: 420, h: 300 },
        },
        terminal: {
            title: "Terminal",
            icon: "Terminal",
            base: { x: 100, y: 260, w: 620, h: 240 },
        },
        doc: {
            title: "Document",
            icon: "Doc",
            base: { x: 160, y: 120, w: 640, h: 420 },
        },
    };

    const computeInitialBounds = (
        base: { x: number; y: number; w?: number; h?: number },
        offset: number
    ): { bounds: Bounds; maximize: boolean } => {
        const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
        const vh = typeof window !== "undefined" ? window.innerHeight : 768;
        const minW = 260;
        const minH = 160;
        const desiredW = Math.max(minW, base.w ?? 480);
        const desiredH = Math.max(minH, base.h ?? 300);
        const usableH = Math.max(0, vh - TASKBAR_H);
        const maximize = desiredW > vw || desiredH > usableH;
        const w = Math.min(desiredW, vw);
        const h = Math.min(desiredH, usableH);
        const x = Math.max(0, Math.min(base.x + offset, Math.max(0, vw - w)));
        const y = Math.max(
            0,
            Math.min(base.y + offset, Math.max(0, usableH - h))
        );
        return { bounds: { x, y, w, h }, maximize };
    };

    const createWin = (kind: Kind): Win => {
        const meta = kindMeta[kind];
        const idx = wins.filter((w) => w.kind === kind).length;
        const id = `${kind}-${++idCounter.current}`;
        const offset = 24 * idx;
        const { bounds, maximize } = computeInitialBounds(meta.base, offset);
        return {
            id,
            kind,
            title: meta.title,
            icon: meta.icon,
            minimized: false,
            maximized: maximize,
            z: ++zCounter.current,
            bounds,
        };
    };

    const openAndActivate = (kind: Kind) => {
        const w = createWin(kind);
        setWins((prev) => [...prev, w]);
        setActiveId(w.id);
    };

    const openDoc = (type: "project" | "post", slug: string) => {
        const meta =
            type === "project"
                ? projects.find((p) => p.slug === slug)
                : posts.find((p) => p.slug === slug);
        const title = meta?.title || slug;
        const base = { x: 160, y: 120, w: 640, h: 420 };
        const { bounds, maximize } = computeInitialBounds(base, 24);
        const doc: Win = {
            id: `doc-${++idCounter.current}`,
            kind: "doc",
            title,
            icon: "Doc",
            minimized: false,
            maximized: maximize,
            z: ++zCounter.current,
            bounds,
            payload: { type, slug },
        };
        setWins((prev) => [...prev, doc]);
        setActiveId(doc.id);
    };

    const activateWin = (id: string) => {
        setWins((prev) =>
            prev.map((w) =>
                w.id === id
                    ? { ...w, minimized: false, z: ++zCounter.current }
                    : w
            )
        );
        setActiveId(id);
    };

    const toggleTask = (id: string) => {
        setWins((prev) =>
            prev.map((w) => {
                if (w.id !== id) return w;
                const isActive = activeId === id && !w.minimized;
                if (isActive) return { ...w, minimized: true };
                return { ...w, minimized: false, z: ++zCounter.current };
            })
        );
        setActiveId((curr) => (curr === id ? curr : id));
    };

    // Show Desktop: minimize all or restore previous
    const doShowDesktop = () => {
        if (!showDesktop) {
            lastUnminimized.current = wins
                .filter((w) => !w.minimized)
                .map((w) => w.id);
            setWins((prev) => prev.map((w) => ({ ...w, minimized: true })));
            setActiveId(null);
        } else {
            const toRestore = new Set(lastUnminimized.current);
            setWins((prev) =>
                prev.map((w) => ({ ...w, minimized: !toRestore.has(w.id) }))
            );
        }
        setShowDesktop((v) => !v);
    };

    useHotkeys({
        onBacktick: () => openAndActivate("terminal"),
        onEscape: () => undefined,
    });

    return (
        <div className="desktop">
            <Wallpaper />
            <DesktopIcons
                onOpen={(name) => {
                    openAndActivate(name.toLowerCase() as Kind);
                }}
            />
            <div
                className="taskbar"
                onClick={() => {
                    setStartOpen(false);
                }}
            >
                <div className="taskbar-left">
                    <StartButton
                        onClick={(e) => {
                            e.stopPropagation();
                            setStartOpen((v) => !v);
                        }}
                    />
                </div>
                <div className="taskbar-tasks">
                    {wins.map((w) => (
                        <TaskItem
                            key={w.id}
                            label={w.title}
                            icon={kindMeta[w.kind].icon}
                            active={activeId === w.id && !w.minimized}
                            minimized={w.minimized}
                            onClick={() => {
                                toggleTask(w.id);
                            }}
                        />
                    ))}
                </div>
                <div className="taskbar-right">
                    <button
                        className="show-desktop"
                        title="Show Desktop"
                        onClick={(e) => {
                            e.stopPropagation();
                            doShowDesktop();
                        }}
                    />
                    <Clock />
                </div>
            </div>
            {startOpen && (
                <StartMenu
                    onOpen={(name: Kind) => {
                        openAndActivate(name);
                    }}
                    onClose={() => setStartOpen(false)}
                />
            )}
            {wins
                .filter((w) => !w.minimized)
                .map((w) => (
                    <Window
                        key={w.id}
                        title={w.title}
                        iconName={w.icon}
                        initial={w.bounds}
                        onClose={() =>
                            setWins((prev) => {
                                const next = prev.filter((x) => x.id !== w.id);
                                if (activeId === w.id) {
                                    const top = next.reduce(
                                        (acc, it) =>
                                            it.z > (acc?.z ?? -Infinity)
                                                ? it
                                                : acc,
                                        undefined as Win | undefined
                                    );
                                    setActiveId(top?.id ?? null);
                                }
                                return next;
                            })
                        }
                        onActivate={() => activateWin(w.id)}
                        zIndex={w.z}
                        isMaximized={w.maximized}
                        onMinimize={() =>
                            setWins((prev) =>
                                prev.map((x) =>
                                    x.id === w.id
                                        ? { ...x, minimized: true }
                                        : x
                                )
                            )
                        }
                        onToggleMaximize={() =>
                            setWins((prev) =>
                                prev.map((x) =>
                                    x.id === w.id
                                        ? { ...x, maximized: !x.maximized }
                                        : x
                                )
                            )
                        }
                        onBoundsChange={(b) =>
                            setWins((prev) =>
                                prev.map((x) =>
                                    x.id === w.id ? { ...x, bounds: b } : x
                                )
                            )
                        }
                    >
                        {w.kind === "projects" && (
                            <ExplorerList
                                items={projects}
                                onOpen={(slug) => openDoc("project", slug)}
                            />
                        )}
                        {w.kind === "blog" && (
                            <ExplorerList
                                items={posts}
                                onOpen={(slug) => openDoc("post", slug)}
                            />
                        )}
                        {w.kind === "about" && (
                            <div>
                                <AboutContent />
                            </div>
                        )}
                        {w.kind === "terminal" && (
                            <Terminal
                                commands={{
                                    help: () =>
                                        [
                                            "Available commands:",
                                            "  help                 Show this help",
                                            "  projects             List projects",
                                            "  blog                 List blog posts",
                                            "  open <type> <slug>   Open a project/post (type=project|post)",
                                            "  clear                Clear the terminal",
                                        ].join("\n"),
                                    projects: () =>
                                        projects
                                            .map(
                                                (p: Meta) =>
                                                    `- ${p.slug}  (${p.title})`
                                            )
                                            .join("\n") || "No projects yet.",
                                    blog: () =>
                                        posts
                                            .map(
                                                (p: Meta) =>
                                                    `- ${p.slug}  (${p.title})`
                                            )
                                            .join("\n") || "No posts yet.",
                                    open: ([type, slug]) => {
                                        if (!type || !slug)
                                            return "Usage: open <project|post> <slug>";
                                        if (type === "project") {
                                            openDoc("project", slug);
                                            return `Opening project: ${slug}`;
                                        }
                                        if (type === "post") {
                                            openDoc("post", slug);
                                            return `Opening post: ${slug}`;
                                        }
                                        return "Type must be 'project' or 'post'.";
                                    },
                                    clear: () => "__CLEAR__",
                                }}
                            />
                        )}
                        {w.kind === "doc" && <DocView payload={w.payload} />}
                    </Window>
                ))}
        </div>
    );
}

function ExplorerList({
    items,
    onOpen,
}: {
    items: Meta[];
    onOpen: (slug: string) => void;
}) {
    const [view, setView] = useState<"icons" | "list">(
        () =>
            (localStorage.getItem("explorer:view") as "icons" | "list") ||
            "icons"
    );
    const [selected, setSelected] = useState<string | null>(null);
    const [hover, setHover] = useState<string | null>(null);
    const [query, setQuery] = useState<string>("");
    const setAndPersistView = (v: "icons" | "list") => {
        setView(v);
        try {
            localStorage.setItem("explorer:view", v);
        } catch {}
    };
    const onClickItem = (slug: string) =>
        setSelected((s) => (s === slug ? null : slug));
    const onOpenItem = (slug: string) => onOpen(slug);
    const q = query.trim().toLowerCase();
    const filtered = q
        ? items.filter((it) => {
              const hay = [
                  it.title,
                  it.summary || "",
                  (it.tags || []).join(","),
                  it.slug,
              ]
                  .join("\n")
                  .toLowerCase();
              return hay.includes(q);
          })
        : items;

    return (
        <div className="explorer">
            <div className="explorer-toolbar">
                <button className="explorer-btn">
                    <React95Icon name="Projects" size={18} /> Up
                </button>
                <div
                    style={{
                        marginLeft: "auto",
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                    }}
                >
                    <input
                        type="text"
                        placeholder="Search..."
                        value={query}
                        onChange={(e) => setQuery(e.currentTarget.value)}
                        style={{
                            height: 24,
                            padding: "2px 6px",
                            border: "2px inset #fff",
                            background: "#fff",
                        }}
                    />
                    <button
                        className="explorer-btn"
                        onClick={() => setAndPersistView("icons")}
                        title="Large Icons"
                    >
                        🔳 Icons
                    </button>
                    <button
                        className="explorer-btn"
                        onClick={() => setAndPersistView("list")}
                        title="Details List"
                    >
                        📃 List
                    </button>
                </div>
            </div>
            {view === "icons" ? (
                <ul
                    className="explorer-list"
                    style={{
                        gridTemplateColumns:
                            "repeat(auto-fill, minmax(220px, 1fr))",
                    }}
                >
                    {filtered.map((it) => (
                        <li key={it.slug}>
                            <button
                                className="explorer-item"
                                onClick={() => onClickItem(it.slug)}
                                onDoubleClick={() => onOpenItem(it.slug)}
                                onMouseEnter={() => setHover(it.slug)}
                                onMouseLeave={() =>
                                    setHover((s) => (s === it.slug ? null : s))
                                }
                                title={it.title}
                                style={{
                                    borderColor:
                                        selected === it.slug
                                            ? "#000"
                                            : "transparent",
                                }}
                            >
                                <React95Icon name="Doc" size={24} />
                                <div className="meta">
                                    <div className="name">{it.title}</div>
                                    {it.summary ? (
                                        <div className="desc">{it.summary}</div>
                                    ) : null}
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <table
                    className="explorer-table"
                    style={{ width: "100%", borderCollapse: "collapse" }}
                >
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left" }}>Name</th>
                            <th style={{ textAlign: "left", width: 140 }}>
                                Date
                            </th>
                            <th style={{ textAlign: "left", width: 220 }}>
                                Tags
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((it) => (
                            <tr
                                key={it.slug}
                                onClick={() => onClickItem(it.slug)}
                                onDoubleClick={() => onOpenItem(it.slug)}
                                onMouseEnter={() => setHover(it.slug)}
                                onMouseLeave={() =>
                                    setHover((s) => (s === it.slug ? null : s))
                                }
                                style={{
                                    background:
                                        selected === it.slug
                                            ? "#d8d8d8"
                                            : hover === it.slug
                                            ? "#ececec"
                                            : "transparent",
                                    cursor: "default",
                                }}
                            >
                                <td>
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        <React95Icon name="Doc" size={18} />{" "}
                                        {it.title}
                                    </span>
                                </td>
                                <td>{it.date ?? ""}</td>
                                <td>{it.tags?.join(", ") ?? ""}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <div
                className="explorer-status"
                style={{
                    padding: 4,
                    borderTop: "2px solid #404040",
                    background: "#c0c0c0",
                }}
            >
                <span>
                    {filtered.length}/{items.length} item
                    {filtered.length === 1 ? "" : "s"}
                </span>
                {selected && (
                    <span style={{ marginLeft: 12 }}>Selected: {selected}</span>
                )}
            </div>
        </div>
    );
}

function DocView({
    payload,
}: {
    payload?: { type: "project" | "post"; slug: string };
}) {
    if (!payload)
        return (
            <div className="prose">
                This document cannot be restored. Please reopen it from the
                Explorer.
            </div>
        );
    const mod =
        payload.type === "project"
            ? getProjectBySlug(payload.slug)
            : getPostBySlug(payload.slug);
    if (!mod || !mod.default)
        return <div className="prose">Not found or invalid document.</div>;
    const Component = mod.default as React.ComponentType<any>;
    try {
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
        } as const;
        return (
            <MDXProvider components={mdxComponents}>
                <div className="prose">
                    <Component />
                </div>
            </MDXProvider>
        );
    } catch (e) {
        return <div className="prose">Error rendering document.</div>;
    }
}

// no-op

function Wallpaper() {
    return <div className="wallpaper" />;
}

function useHotkeys(handlers: {
    onBacktick: () => void;
    onEscape: () => void;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "`") {
                handlers.onBacktick();
            } else if (e.key === "Escape") {
                handlers.onEscape();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [handlers]);
}

function DesktopIcons({
    onOpen,
    iconSize = 32,
}: {
    onOpen: (name: "Projects" | "Blog" | "About" | "Terminal") => void;
    iconSize?: number;
}) {
    const icons: Array<{
        id: string;
        name: "Projects" | "Blog" | "About" | "Terminal";
        icon: string;
    }> = [
        { id: "desk-projects", name: "Projects", icon: "Projects" },
        { id: "desk-blog", name: "Blog", icon: "Blog" },
        { id: "desk-about", name: "About", icon: "About" },
        { id: "desk-terminal", name: "Terminal", icon: "Terminal" },
    ];
    return (
        <div className="desktop-icons">
            {icons.map((it) => (
                <button
                    key={it.id}
                    className="desktop-icon"
                    onDoubleClick={() => onOpen(it.name)}
                >
                    <React95Icon name={it.icon} size={iconSize} />
                    <span>{it.name}</span>
                </button>
            ))}
        </div>
    );
}

// Taskbar is now a custom element styled in CSS below; removed the old Toolbar-based Taskbar.

function StartButton({
    onClick,
}: {
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
    return (
        <Button onClick={onClick}>
            <span
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
                <React95Icon name="Start" size={24} /> <strong>Start</strong>
            </span>
        </Button>
    );
}

function TaskItem({
    label,
    icon,
    onClick,
    active,
    minimized,
}: {
    label: string;
    icon: string;
    onClick: () => void;
    active?: boolean;
    minimized?: boolean;
}) {
    const maxChars = (() => {
        if (typeof window === "undefined") return 24;
        const w = window.innerWidth;
        if (w < 420) return 12;
        if (w < 720) return 16;
        if (w < 1024) return 20;
        return 26;
    })();
    const short = middleEllipsis(label, maxChars);
    return (
        <button
            className={`task-btn ${active ? "pressed" : ""} ${
                minimized ? "minimized" : ""
            }`}
            onClick={onClick}
            title={label}
        >
            <span
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
                <React95Icon name={icon} size={20} />{" "}
                <span className="label">{short}</span>
            </span>
        </button>
    );
}

function middleEllipsis(text: string, max: number) {
    if (!text) return text;
    if (text.length <= max) return text;
    if (max <= 1) return "…";
    const left = Math.ceil((max - 1) / 2);
    const right = Math.floor((max - 1) / 2);
    return text.slice(0, left) + "…" + text.slice(text.length - right);
}

function Clock() {
    const [now, setNow] = useState<string>(() =>
        new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        })
    );
    useEffect(() => {
        const id = setInterval(
            () =>
                setNow(
                    new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })
                ),
            1000 * 30
        );
        return () => clearInterval(id);
    }, []);
    return (
        <div
            style={{
                padding: "4px 8px",
                border: "2px inset #fff",
                minWidth: 64,
                textAlign: "center",
            }}
        >
            {now}
        </div>
    );
}

function StartMenu({
    onOpen,
    onClose,
}: {
    onOpen: (name: "projects" | "blog" | "about" | "terminal") => void;
    onClose: () => void;
}) {
    return (
        <div className="start-menu" onClick={(e) => e.stopPropagation()}>
            <div className="start-menu-right">
                <button
                    onClick={() => {
                        onOpen("projects");
                        onClose();
                    }}
                >
                    <React95Icon name="Projects" size={20} /> Projects
                </button>
                <button
                    onClick={() => {
                        onOpen("blog");
                        onClose();
                    }}
                >
                    <React95Icon name="Blog" size={20} /> Blog
                </button>
                <button
                    onClick={() => {
                        onOpen("about");
                        onClose();
                    }}
                >
                    <React95Icon name="About" size={20} /> About
                </button>
                <button
                    onClick={() => {
                        onOpen("terminal");
                        onClose();
                    }}
                >
                    <React95Icon name="Terminal" size={20} /> Terminal
                </button>
            </div>
        </div>
    );
}
