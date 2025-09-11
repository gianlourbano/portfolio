export function Note({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                border: "2px solid #808080",
                background: "#ffffe0",
                padding: 8,
                margin: "8px 0",
            }}
        >
            <strong style={{ display: "block", marginBottom: 4 }}>Note</strong>
            <div>{children}</div>
        </div>
    );
}
