export function Figure({
    src,
    alt,
    caption,
    width,
}: {
    src: string;
    alt?: string;
    caption?: string;
    width?: number | string;
}) {
    return (
        <figure
            style={{
                margin: "12px auto",
                textAlign: "center",
                maxWidth: "100%",
            }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt}
                style={{
                    maxWidth: "100%",
                    height: "auto",
                    maxHeight: "60vh",
                    width: width ?? "auto",
                    margin: "0 auto",
                    display: "block",
                }}
            />
            {caption && (
                <figcaption
                    style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        marginTop: 4,
                    }}
                >
                    {caption}
                </figcaption>
            )}
        </figure>
    );
}
