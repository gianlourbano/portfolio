import { useEffect, useMemo, useRef, useState } from "react";

type CommandFn = (args: string[]) => string | Promise<string>;
export type CommandMap = Record<string, CommandFn>;

export function Terminal({ commands }: { commands: CommandMap }) {
    const [lines, setLines] = useState<string[]>([
        "Microsoft(R) Win95 DOS Shell [Portfolio Edition]",
        "Type 'help' for commands.",
    ]);
    const [current, setCurrent] = useState("");
    const [history, setHistory] = useState<string[]>(() => {
        try {
            const raw = localStorage.getItem("terminal:history");
            if (raw) return JSON.parse(raw);
        } catch {}
        return [];
    });
    const [cwd, setCwd] = useState<string>(() => {
        try {
            return localStorage.getItem("terminal:cwd") || "/";
        } catch {
            return "/";
        }
    });
    const [hIndex, setHIndex] = useState<number>(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const lastMatchesRef = useRef<string[] | null>(null);
    const matchIndexRef = useRef<number>(0);

    useEffect(() => inputRef.current?.focus(), []);
    useEffect(
        () => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight),
        [lines]
    );

    useEffect(() => {
        try {
            const cap = 100;
            const data = history.slice(0, cap);
            localStorage.setItem("terminal:history", JSON.stringify(data));
        } catch {}
    }, [history]);
    useEffect(() => {
        try {
            localStorage.setItem("terminal:cwd", cwd);
        } catch {}
    }, [cwd]);

    const allCommands = useMemo(() => {
        const base: CommandMap = { ...commands };
        if (!base.echo) base.echo = (args) => args.join(" ");
        if (!base.date) base.date = () => formatDateDos();
        if (!base.cls) base.cls = () => "__CLEAR__";
        if (!base.ver) base.ver = () => "Windows 95 [Version 4.00.950]";
        if (!base.help) {
            base.help = () => {
                const extra = Object.keys(base)
                    .filter((k) => !BUILT_INS.includes(k))
                    .sort();
                return [
                    "Supported commands:",
                    "  DIR   CD   TYPE   ECHO   DATE   TIME   VER   CLS   HELP   OPEN",
                    extra.length ? "Extended:" : "",
                    ...extra.map((k) => "  " + k.toUpperCase()),
                    "",
                    "Use DIR to list BLOG and PROJECTS. OPEN <slug> from within a folder, or TYPE <slug>.",
                ]
                    .filter(Boolean)
                    .join("\n");
            };
        }
        return base;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [commands, history]);

    const run = async (raw: string) => {
        const prompt = `${formatPrompt(cwd)} ${raw}`;
        if (!raw.trim()) {
            setLines((prev) => [...prev, prompt]);
            return;
        }
        try {
            const out = await runShell(raw, {
                cwd,
                setCwd,
                commands: allCommands,
                history,
            });
            if (out.special === "CLEAR") {
                setLines([]);
                return;
            }
            setLines((prev) => [...prev, prompt, out.text]);
        } catch (e: any) {
            setLines((prev) => [...prev, prompt, e?.message || "Error"]);
        }
    };

    const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.key === "Enter") {
            setHistory((h) => [current, ...h]);
            setHIndex(-1);
            run(current);
            setCurrent("");
            lastMatchesRef.current = null;
            matchIndexRef.current = 0;
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const next = Math.min(hIndex + 1, history.length - 1);
            if (history[next]) {
                setHIndex(next);
                setCurrent(history[next]);
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = Math.max(hIndex - 1, -1);
            setHIndex(next);
            setCurrent(next === -1 ? "" : history[next]);
        } else if (e.key === "c" && (e.ctrlKey || e.metaKey)) {
            setCurrent("");
        } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
            // clear screen
            e.preventDefault();
            setLines([]);
        } else if (e.key === "Tab") {
            e.preventDefault();
            const token = current.trim();
            if (!token || token.includes(" ")) return;
            const names = getCommandNames(allCommands);
            const matches = names.filter((n) => n.startsWith(token));
            if (!matches.length) return;
            const same =
                JSON.stringify(matches) ===
                JSON.stringify(lastMatchesRef.current);
            if (!same) {
                lastMatchesRef.current = matches;
                matchIndexRef.current = 0;
            }
            const pick = matches[matchIndexRef.current % matches.length];
            matchIndexRef.current =
                (matchIndexRef.current + 1) % matches.length;
            setCurrent(pick + " ");
        }
    };

    return (
        <div className="terminal">
            <div ref={scrollRef} className="terminal-out">
                {lines.map((l, i) => (
                    <div key={i}>{l}</div>
                ))}
            </div>
            <div className="terminal-in">
                <span className="prompt">{formatPrompt(cwd)}</span>
                <input
                    ref={inputRef}
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Type a command..."
                    aria-label="Terminal input"
                />
                {(() => {
                    const token = current.trim();
                    if (!token || token.includes(" ")) return null;
                    const names = getCommandNames(allCommands);
                    const matches = names
                        .filter((n) => n.startsWith(token))
                        .slice(0, 6);
                    if (!matches.length) return null;
                    return (
                        <div
                            style={{
                                marginLeft: 8,
                                fontSize: 12,
                                opacity: 0.7,
                            }}
                        >
                            {matches.join("   ")}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}

function formatPrompt(cwd: string) {
    // DOS typically uppercases path segments
    return `C:${toBackslash(cwd).toUpperCase()}>`;
}

const BUILT_INS = [
    "cd",
    "dir",
    "type",
    "echo",
    "date",
    "time",
    "ver",
    "clear",
    "cls",
    "help",
    "open",
];

function getCommandNames(all: CommandMap) {
    return Array.from(new Set([...BUILT_INS, ...Object.keys(all)])).sort();
}

type ShellCtx = {
    cwd: string;
    setCwd: (p: string) => void;
    commands: CommandMap;
    history: string[];
};

async function runShell(
    raw: string,
    ctx: ShellCtx
): Promise<{ text: string; special?: "CLEAR" }> {
    // No pipelines in pure Win95 style; treat entire line as single command
    const [name, ...args] = tokenize(raw);
    let stdin: string[] = [];
    if (!name) return { text: "" };
    const lower = name.toLowerCase();
    if (lower === "cd") {
        const targetRaw = args[0];
        const {
            ok,
            path: newPath,
            error,
        } = resolveCdTarget(targetRaw, ctx.cwd);
        if (ok && newPath) {
            ctx.setCwd(newPath);
            stdin = [];
        } else if (error) {
            stdin = [error];
        } else {
            stdin = ["Invalid directory"]; // fallback
        }
    } else if (lower === "dir") {
        const path = resolvePath(args[0] || ".", ctx.cwd);
        stdin = await shellDir(path, ctx, /*decorate*/ true);
    } else if (lower === "type") {
        if (args.length) {
            const outputs: string[] = [];
            for (const a of args) {
                const p = resolvePath(a, ctx.cwd);
                const parsed = parsePathType(p);
                if (!parsed) {
                    outputs.push(`File not found - ${a}`);
                    continue;
                }
                const meta = await getItemLine(ctx, parsed.type, parsed.slug);
                if (meta) outputs.push(meta);
            }
            stdin = outputs;
        }
    } else if (lower === "echo") {
        stdin = [args.join(" ")];
    } else if (lower === "date" || lower === "time") {
        stdin = [
            (lower === "date" ? "Current date is " : "Current time is ") +
                formatDateDos(),
        ];
    } else if (lower === "ver") {
        stdin = ["Microsoft Windows 95 [Version 4.00.950]"];
    } else if (lower === "clear" || lower === "cls") {
        return { text: "", special: "CLEAR" };
    } else if (lower === "help") {
        const custom = Object.keys(ctx.commands)
            .filter((k) => !BUILT_INS.includes(k))
            .sort();
        stdin = [
            "Supported commands:",
            "  DIR   CD   TYPE   ECHO   DATE   TIME   VER   CLS   HELP   OPEN",
            custom.length ? "Extended:" : "",
            ...custom.map((k) => "  " + k.toUpperCase()),
            "",
            "Use DIR then OPEN <slug> inside BLOG or PROJECTS.",
        ];
    } else if (lower === "open" && args.length >= 1) {
        if (
            args.length === 1 &&
            (ctx.cwd === "/blog" || ctx.cwd === "/projects")
        ) {
            const t = ctx.cwd === "/blog" ? "post" : "project";
            const out = await Promise.resolve(
                ctx.commands.open?.([t, args[0]])
            );
            stdin = typeof out === "string" ? out.split(/\r?\n/) : [];
        } else {
            const out = await Promise.resolve(ctx.commands.open?.(args));
            stdin = typeof out === "string" ? out.split(/\r?\n/) : [];
        }
    } else if (ctx.commands[lower]) {
        const out = await Promise.resolve(ctx.commands[lower]?.(args));
        if (out === "__CLEAR__") return { text: "", special: "CLEAR" };
        stdin = typeof out === "string" ? out.split(/\r?\n/) : [];
    } else {
        stdin = ["Bad command or file name"];
    }
    return { text: stdin.join("\n") };
}

// pipeline removed for Win95 authenticity

function tokenize(segment: string): string[] {
    const tokens: string[] = [];
    const re = /\s*("([^"]*)"|'([^']*)'|([^\s"']+))/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(segment))) {
        tokens.push(m[2] ?? m[3] ?? m[4] ?? "");
    }
    return tokens;
}

function resolvePath(p: string, cwd: string): string {
    if (!p || p === ".") return cwd;
    if (p === "/") return "/";
    if (p === "..") return "/";
    if (!p.startsWith("/")) p = `${cwd}/${p}`;
    // normalize
    p = p.replace(/\\+/g, "/").replace(/\/+/g, "/");
    p = p.replace(/\/\.(?:\/|$)/g, "/").replace(/\/[^/]+\/\.\.(?:\/|$)/g, "/");
    if (p.startsWith("/blog")) {
        const rest = p.slice(5); // after '/blog'
        const seg = rest.split("/").filter(Boolean)[0];
        return seg ? `/blog/${seg}` : "/blog";
    }
    if (p.startsWith("/projects")) {
        const rest = p.slice(9); // after '/projects'
        const seg = rest.split("/").filter(Boolean)[0];
        return seg ? `/projects/${seg}` : "/projects";
    }
    return "/";
}

// Strict cd target resolver: only allow root, /blog, /projects
function resolveCdTarget(
    arg: string | undefined,
    cwd: string
): { ok: boolean; path?: string; error?: string } {
    if (!arg || arg === "") return { ok: true, path: "/" };
    const raw = arg.trim();
    // Support backslashes like Windows input
    let norm = raw.replace(/\\+/g, "/");
    if (norm === ".") return { ok: true, path: cwd };
    if (norm === "..") return { ok: true, path: "/" };
    if (norm === "/" || /^c:\\?$/i.test(raw)) return { ok: true, path: "/" };
    if (/^c:\\blog$/i.test(raw)) return { ok: true, path: "/blog" };
    if (/^c:\\projects$/i.test(raw)) return { ok: true, path: "/projects" };
    if (/^\/?blog$/i.test(norm)) return { ok: true, path: "/blog" };
    if (/^\/?projects$/i.test(norm)) return { ok: true, path: "/projects" };
    // Disallow deeper nesting: e.g., blog/foo should not change directory (simulate flat virtual dirs)
    if (/blog\//i.test(norm) || /projects\//i.test(norm)) {
        return { ok: false, error: "Access denied" };
    }
    return { ok: false, error: "Directory not found" };
}

async function shellDir(
    path: string,
    ctx: ShellCtx,
    decorate = false
): Promise<string[]> {
    const now = new Date();
    const header: string[] = [];
    type Entry = { kind: "dir" | "file"; name: string; size?: number };
    const entries: Entry[] = [];

    const addDir = (name: string) => entries.push({ kind: "dir", name });
    const addFile = (name: string) => {
        const size = ((name.length * 321 + 1024) % 32768) + 512; // broader pseudo size range
        entries.push({ kind: "file", name, size });
    };

    const isRoot = path === "/";
    const isBlog = path === "/blog";
    const isProjects = path === "/projects";

    if (isRoot) {
        if (decorate) header.push(" Directory of C: \\");
        addDir(".");
        addDir("..");
        addDir("BLOG");
        addDir("PROJECTS");
    } else if (isBlog && ctx.commands.blog) {
        if (decorate) header.push(" Directory of C: \\BLOG");
        addDir(".");
        addDir("..");
        const out = await Promise.resolve(ctx.commands.blog([]));
        parseList(out).forEach((i) => addFile(i.toUpperCase() + ".MDX"));
    } else if (isProjects && ctx.commands.projects) {
        if (decorate) header.push(" Directory of C: \\PROJECTS");
        addDir(".");
        addDir("..");
        const out = await Promise.resolve(ctx.commands.projects([]));
        parseList(out).forEach((i) => addFile(i.toUpperCase() + ".MDX"));
    } else {
        return ["File Not Found"];
    }

    // Formatting
    const dateTime = (d: Date) => {
        // mm-dd-yyyy  hh:mm AM  (approx; AM/PM upper-case)
        const mm = padLeft(String(d.getMonth() + 1), 2);
        const dd = padLeft(String(d.getDate()), 2);
        const yyyy = d.getFullYear();
        let h = d.getHours();
        const am = h < 12;
        h = h % 12 || 12;
        const hh = padLeft(String(h), 2);
        const mi = padLeft(String(d.getMinutes()), 2);
        const ap = am ? "AM" : "PM";
        return `${mm}-${dd}-${yyyy}  ${hh}:${mi} ${ap}`;
    };
    const lineDate = dateTime(now);
    const attrColWidth = 17; // space for <DIR> or sized numbers aligned right
    const sizeStr = (n: number) => n.toLocaleString("en-US");
    const formatEntry = (e: Entry) => {
        if (e.kind === "dir") {
            const attr = padLeft("<DIR>", attrColWidth);
            return `${lineDate}  ${attr}  ${e.name}`;
        }
        const sz = padLeft(sizeStr(e.size || 0), attrColWidth);
        return `${lineDate}  ${sz}  ${e.name}`;
    };

    const body = entries.map(formatEntry);
    const fileCount = entries.filter((e) => e.kind === "file").length;
    const dirCount = entries.filter((e) => e.kind === "dir").length;
    const totalBytes = entries
        .filter((e) => e.kind === "file")
        .reduce((a, e) => a + (e.size || 0), 0);
    const bytesFree = 12582912; // 12,582,912 bytes free (arbitrary constant)
    const summary = [
        "",
        padLeft(String(fileCount), 6) +
            " File(s)" +
            (fileCount ? "  " + sizeStr(totalBytes) + " bytes" : ""),
        padLeft(String(dirCount), 6) +
            " Dir(s)  " +
            sizeStr(bytesFree) +
            " bytes free",
    ];

    return decorate ? [...header, "", ...body, ...summary] : body;
}

function parseList(out: string): string[] {
    const lines = out
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    const items = lines.map((l) => {
        const m = /^-\s+([^\s]+)\s+/.exec(l);
        return m ? m[1] : l;
    });
    return items;
}

function parsePathType(
    path: string
): { type: "post" | "project"; slug: string } | null {
    if (path.startsWith("/blog/")) {
        const slug = path.slice(6);
        if (slug) return { type: "post", slug };
    }
    if (path.startsWith("/projects/")) {
        const slug = path.slice(10);
        if (slug) return { type: "project", slug };
    }
    return null;
}

function toBackslash(p: string) {
    if (p === "/") return "\\";
    return p.replace(/\//g, "\\");
}

function formatDosDate(d: Date) {
    // mm-dd-yyyy  hh:mma  (approx DOS-like, not exact spacing)
    const mm = padLeft(String(d.getMonth() + 1), 2);
    const dd = padLeft(String(d.getDate()), 2);
    const yyyy = d.getFullYear();
    let h = d.getHours();
    const am = h < 12;
    h = h % 12 || 12;
    const hh = padLeft(String(h), 2);
    const mi = padLeft(String(d.getMinutes()), 2);
    const ap = am ? "a" : "p";
    return mm + "-" + dd + "-" + yyyy + "  " + hh + ":" + mi + ap;
}

function formatDateDos() {
    const d = new Date();
    return formatDosDate(d).split("  ")[0];
}

function padLeft(s: string, n: number) {
    return s.length >= n ? s : " ".repeat(n - s.length) + s;
}

async function getItemLine(
    ctx: ShellCtx,
    type: "post" | "project",
    slug: string
): Promise<string | null> {
    if (type === "post" && ctx.commands.blog) {
        const out = await Promise.resolve(ctx.commands.blog([]));
        const line = out
            .split(/\r?\n/)
            .map((s) => s.trim())
            .find((l) => l.includes(slug));
        return line || null;
    }
    if (type === "project" && ctx.commands.projects) {
        const out = await Promise.resolve(ctx.commands.projects([]));
        const line = out
            .split(/\r?\n/)
            .map((s) => s.trim())
            .find((l) => l.includes(slug));
        return line || null;
    }
    return null;
}
