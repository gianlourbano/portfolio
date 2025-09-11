import { useEffect, useMemo, useRef, useState } from "react";

type CommandFn = (args: string[]) => string | Promise<string>;
export type CommandMap = Record<string, CommandFn>;

export function Terminal({ commands }: { commands: CommandMap }) {
    const [lines, setLines] = useState<string[]>(["Welcome. Type 'help'."]);
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
        if (!base.history) base.history = () => history.join("\n") || "(empty)";
        if (!base.echo) base.echo = (args) => args.join(" ");
        if (!base.date) base.date = () => new Date().toLocaleString();
        if (!base.cls) base.cls = () => "__CLEAR__";
        if (!base.whoami) base.whoami = () => "Gianlorenzo Urbano @ Musixmatch";
        if (!base.help) {
            base.help = () => {
                const keys = Object.keys(base).sort();
                return [
                    "Available commands:",
                    ...keys.map((k) => `  ${k}`),
                ].join("\n");
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
    return `C:${cwd} >`;
}

const BUILT_INS = [
    "cd",
    "ls",
    "cat",
    "pwd",
    "grep",
    "head",
    "tail",
    "sort",
    "uniq",
    "wc",
    "echo",
    "date",
    "whoami",
    "clear",
    "cls",
    "help",
    "history",
];

function getCommandNames(all: CommandMap) {
    return Array.from(new Set([...BUILT_INS, ...Object.keys(all)])).sort();
}

type ShellCtx = {
    cwd: string;
    setCwd: (p: string) => void;
    commands: CommandMap;
};

async function runShell(
    raw: string,
    ctx: ShellCtx
): Promise<{ text: string; special?: "CLEAR" }> {
    const segments = splitPipeline(raw);
    let stdin: string[] = [];
    for (const seg of segments) {
        const [name, ...args] = tokenize(seg);
        if (!name) continue;
        const lower = name.toLowerCase();
        if (lower === "pwd") {
            stdin = [ctx.cwd];
        } else if (lower === "cd") {
            const next = resolvePath(args[0] || "/", ctx.cwd);
            ctx.setCwd(next);
            stdin = [];
        } else if (lower === "ls") {
            const path = resolvePath(args[0] || ".", ctx.cwd);
            stdin = await shellLs(path, ctx);
        } else if (lower === "echo") {
            stdin = [args.join(" ")];
        } else if (lower === "grep") {
            const q = args.join(" ");
            if (!q) continue;
            const rx = new RegExp(
                q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                "i"
            );
            let source = stdin;
            if (!source.length) {
                // If no stdin, grep the current directory listing for convenience
                source = await shellLs(ctx.cwd, ctx);
            }
            stdin = source.filter((l) => rx.test(l));
        } else if (lower === "cat") {
            if (stdin.length && args.length === 0) {
                // pass-through stdin
                // no-op, already in stdin
            } else if (args.length > 0) {
                const outputs: string[] = [];
                for (const a of args) {
                    const p = resolvePath(a, ctx.cwd);
                    const parsed = parsePathType(p);
                    if (!parsed) {
                        outputs.push(`cat: unsupported path: ${a}`);
                        continue;
                    }
                    const line = await getItemLine(
                        ctx,
                        parsed.type,
                        parsed.slug
                    );
                    if (line) {
                        outputs.push(line);
                        outputs.push(
                            `(tip: open ${
                                parsed.type === "post" ? "post" : "project"
                            } ${parsed.slug})`
                        );
                    } else {
                        outputs.push(`cat: not found: ${a}`);
                    }
                }
                stdin = outputs;
            } else {
                // nothing to do
            }
        } else if (lower === "head") {
            const n = parseInt(args[0] || "10");
            stdin = stdin.slice(0, isNaN(n) ? 10 : n);
        } else if (lower === "tail") {
            const n = parseInt(args[0] || "10");
            stdin = stdin.slice(-(isNaN(n) ? 10 : n));
        } else if (lower === "sort") {
            stdin = [...stdin].sort();
        } else if (lower === "uniq") {
            const seen = new Set<string>();
            stdin = stdin.filter((l) =>
                seen.has(l) ? false : (seen.add(l), true)
            );
        } else if (lower === "wc") {
            const text = stdin.join("\n");
            const words = text ? text.trim().split(/\s+/).length : 0;
            stdin = [`${stdin.length} ${words} ${text.length}`];
        } else if (lower === "date") {
            stdin = [new Date().toLocaleString()];
        } else if (lower === "whoami") {
            stdin = ["Gianlorenzo Urbano @ Musixmatch"];
        } else if (lower === "clear" || lower === "cls") {
            return { text: "", special: "CLEAR" };
        } else if (lower === "help") {
            const custom = Object.keys(ctx.commands)
                .filter((k) => !BUILT_INS.includes(k))
                .sort();
            stdin = [
                "Built-ins: cd, ls, pwd, grep, head, tail, sort, uniq, wc, echo, date, whoami, clear/cls, history",
                "Custom:",
                ...custom.map((k) => "  " + k),
            ];
        } else if (lower === "open" && args.length >= 1) {
            const out = await Promise.resolve(ctx.commands.open?.(args));
            stdin = typeof out === "string" ? out.split(/\r?\n/) : [];
        } else {
            if (!ctx.commands[lower]) {
                stdin = [`Command not found: ${lower}`];
            } else {
                const out = await Promise.resolve(
                    ctx.commands[lower]?.(args.length ? args : stdin)
                );
                if (out === "__CLEAR__") return { text: "", special: "CLEAR" };
                stdin = typeof out === "string" ? out.split(/\r?\n/) : [];
            }
        }
    }
    return { text: stdin.join("\n") };
}

function splitPipeline(raw: string): string[] {
    return raw
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
}

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

async function shellLs(path: string, ctx: ShellCtx): Promise<string[]> {
    if (path === "/") return ["blog/", "projects/"];
    if (path === "/blog" && ctx.commands.blog) {
        const out = await Promise.resolve(ctx.commands.blog([]));
        return parseList(out);
    }
    if (path === "/projects" && ctx.commands.projects) {
        const out = await Promise.resolve(ctx.commands.projects([]));
        return parseList(out);
    }
    return [];
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
