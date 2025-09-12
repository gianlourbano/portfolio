export function Note({ children, title }: { children: React.ReactNode, title?: string }) {
    return (
        <div
            style={{
                border: "2px solid #808080",
                background: "#ffffe0",
                padding: 8,
                margin: "8px 0",
            }}
        >
            <strong style={{ display: "block", marginBottom: 4 }}>{title || "Note"}</strong>
            <div>{children}</div>
        </div>
    );
}
