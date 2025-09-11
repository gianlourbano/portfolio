type FileItem = { name: string; href?: string; note?: string };

export function Files(props: {
    items?: Array<FileItem>;
    files?: Array<string | FileItem>;
    title?: string;
}) {
    // Normalize props: accept either `items` (object array) or `files` (string/object array)
    const raw = (props.items ?? props.files ?? []) as Array<string | FileItem>;
    const items: FileItem[] = raw.map((it) =>
        typeof it === "string"
            ? {
                  name: it,
                  // if it looks like a path or URL, expose as href
                  href:
                      /^(https?:)?\/\//.test(it) || it.startsWith("/")
                          ? it
                          : undefined,
              }
            : it
    );
    const title = props.title || "Files";
    return (
        <div
            style={{
                border: "2px solid #404040",
                background: "#f0f0f0",
                padding: 8,
                margin: "8px 0",
            }}
        >
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
                {items.map((it, idx) => (
                    <li key={idx}>
                        {it.href ? (
                            <a href={it.href} target="_blank" rel="noreferrer">
                                <code>{it.name}</code>
                            </a>
                        ) : (
                            <code>{it.name}</code>
                        )}
                        {it.note ? (
                            <span style={{ marginLeft: 8, color: "#333" }}>
                                – {it.note}
                            </span>
                        ) : null}
                    </li>
                ))}
            </ul>
        </div>
    );
}
