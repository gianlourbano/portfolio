export function Kbd({ children }: { children: React.ReactNode }) {
    return (
        <kbd
            style={{
                display: "inline-block",
                border: "2px solid #fff",
                borderBottomColor: "#404040",
                borderRightColor: "#404040",
                background: "#eaeaea",
                padding: "0 4px",
                fontSize: "0.9em",
                fontFamily:
                    'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Courier New",monospace',
            }}
        >
            {children}
        </kbd>
    );
}

export function Badge({
    children,
    tone = "info",
}: {
    children: React.ReactNode;
    tone?: "info" | "success" | "warn" | "error";
}) {
    const map: Record<string, string> = {
        info: "#000080",
        success: "#2b8a3e",
        warn: "#b58900",
        error: "#b00020",
    };
    const bg = map[tone] || map.info;
    return (
        <span
            style={{
                display: "inline-block",
                padding: "2px 6px",
                color: "#fff",
                background: bg,
                border: "2px solid #fff",
                borderBottomColor: "#404040",
                borderRightColor: "#404040",
                fontSize: "0.85em",
                fontWeight: 700,
            }}
        >
            {children}
        </span>
    );
}

export function Stat({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <span
            style={{ display: "inline-flex", gap: 6, alignItems: "baseline" }}
        >
            <span style={{ color: "#333" }}>{label}</span>
            <strong>{value}</strong>
        </span>
    );
}
