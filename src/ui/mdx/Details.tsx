import { useState } from "react";

export function Details({
    summary,
    children,
    open: defaultOpen = false,
}: {
    summary: string;
    children: React.ReactNode;
    open?: boolean;
}) {
    const [open, setOpen] = useState(!!defaultOpen);
    return (
        <div
            style={{
                border: "2px solid #fff",
                borderBottomColor: "#404040",
                borderRightColor: "#404040",
                background: "#c0c0c0",
                margin: "8px 0",
            }}
        >
            <button
                onClick={() => setOpen((v) => !v)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    padding: "6px 8px",
                    background: "#c0c0c0",
                    border: "0",
                    fontWeight: 700,
                }}
            >
                <span>{open ? "▾" : "▸"}</span>
                <span>{summary}</span>
            </button>
            {open && (
                <div style={{ padding: 8, background: "#d0d0d0" }}>
                    {children}
                </div>
            )}
        </div>
    );
}
