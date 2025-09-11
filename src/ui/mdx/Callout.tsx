import React from "react";

export function Callout({
    type = "info",
    children,
}: {
    type?: "info" | "warn" | "error" | "success";
    children: React.ReactNode;
}) {
    const palette: Record<
        string,
        { bg: string; border: string; title: string }
    > = {
        info: {
            bg: "rgba(100, 149, 237, 0.12)",
            border: "#6495ed",
            title: "Info",
        },
        warn: {
            bg: "rgba(255, 215, 0, 0.15)",
            border: "#b8860b",
            title: "Warning",
        },
        error: {
            bg: "rgba(220, 20, 60, 0.12)",
            border: "#8b0000",
            title: "Error",
        },
        success: {
            bg: "rgba(60, 179, 113, 0.14)",
            border: "#2e8b57",
            title: "Success",
        },
    };
    const p = palette[type] ?? palette.info;
    return (
        <div
            style={{
                background: p.bg,
                borderLeft: `4px solid ${p.border}`,
                padding: "10px 12px",
                margin: "12px 0",
            }}
        >
            <strong style={{ display: "block", marginBottom: 6 }}>
                {p.title}
            </strong>
            <div>{children}</div>
        </div>
    );
}
