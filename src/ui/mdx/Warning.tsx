export function Warning({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                border: "2px solid #800000",
                background: "#ffdddd",
                padding: 8,
                margin: "8px 0",
            }}
        >
            <strong style={{ display: "block", marginBottom: 4 }}>
                Warning
            </strong>
            <div>{children}</div>
        </div>
    );
}
